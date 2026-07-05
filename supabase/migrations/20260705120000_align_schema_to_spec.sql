-- Align existing schema to the Bean Rater spec.
-- Safe on this database: all public tables have 0 rows at migration time.

-- ============================================================
-- 1. Brands: claimed_by; lock down public writes
-- ============================================================
alter table public.brands
  add column claimed_by uuid references auth.users (id);

-- Spec: no public write access to Brand.
drop policy if exists "brands: authed insert" on public.brands;

-- ============================================================
-- 2. Bags: added_by, bag_size -> text, altitude_masl,
--    verification_status enum replacing verified bool
-- ============================================================
alter table public.bags rename column created_by to added_by;
alter table public.bags alter column added_by set not null;

alter table public.bags alter column bag_size drop not null;
alter table public.bags alter column bag_size type text using bag_size::text;
drop type public.bag_size;

alter table public.bags add column altitude_masl integer;

create type public.verification_status as enum
  ('unverified', 'community_verified', 'roaster_verified');

alter table public.bags
  add column verification_status public.verification_status not null default 'unverified';
alter table public.bags drop column verified;

-- ============================================================
-- 3. Recipes: required brew_time_s / water_temp_c, no vote_count
-- ============================================================
alter table public.recipes alter column brew_time_s set not null;
alter table public.recipes alter column water_temp_c set not null;
alter table public.recipes drop column vote_count;

-- ============================================================
-- 4. Profiles: user_id PK name, recipe_count
-- ============================================================
alter table public.profiles rename column id to user_id;
alter table public.profiles add column recipe_count integer not null default 0;

-- is_admin is a text-body SQL function; recreate for the renamed column.
create or replace function public.is_admin()
returns boolean
language sql
stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

-- Maintain profiles.recipe_count from recipes.
create or replace function public.maintain_recipe_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles
       set recipe_count = recipe_count + 1
     where user_id = new.user_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.profiles
       set recipe_count = greatest(recipe_count - 1, 0)
     where user_id = old.user_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger recipes_maintain_count
  after insert or delete on public.recipes
  for each row execute function public.maintain_recipe_count();

-- ============================================================
-- 5. Flags: one flag per user per bag; auto-flag at 3
-- ============================================================
drop function if exists public.flag_bag(uuid);

create table public.bag_flags (
  bag_id     uuid not null references public.bags (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (bag_id, user_id)
);

alter table public.bag_flags enable row level security;

create or replace function public.apply_bag_flag()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.bags
     set flag_count = flag_count + 1,
         flagged    = (flag_count + 1) >= 3
   where id = new.bag_id;
  return new;
end;
$$;

create trigger bag_flags_apply
  after insert on public.bag_flags
  for each row execute function public.apply_bag_flag();

-- ============================================================
-- 6. RLS policy updates
-- ============================================================
-- Public read excludes flagged bags; admins see everything;
-- the submitter keeps sight of their own bag.
drop policy if exists "bags: public read" on public.bags;
create policy "bags: public read non-flagged" on public.bags
  for select using ((not flagged) or public.is_admin() or added_by = auth.uid());

-- Inserts bind the creator and cannot pre-set moderation/verification state.
drop policy if exists "bags: authed insert" on public.bags;
create policy "bags: authed insert" on public.bags
  for insert to authenticated
  with check (
    auth.uid() = added_by
    and verification_status = 'unverified'
    and flagged = false
    and flag_count = 0
  );

create policy "bag_flags: authed insert" on public.bag_flags
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "bag_flags: read own or admin" on public.bag_flags
  for select using (auth.uid() = user_id or public.is_admin());

-- ============================================================
-- 7. Fuzzy search RPC (pg_trgm)
-- ============================================================
create extension if not exists pg_trgm;

create index bags_coffee_name_trgm on public.bags using gin (coffee_name gin_trgm_ops);
create index brands_name_trgm on public.brands using gin (name gin_trgm_ops);

create or replace function public.search_bags(q text)
returns table (
  bag_id uuid,
  coffee_name text,
  brand_name text,
  roast_level public.roast_level,
  process public.process_method,
  origin text,
  photo_url text,
  verification_status public.verification_status,
  recipe_count bigint,
  sim real
)
language sql
stable
set search_path = public
as $$
  select
    b.id,
    b.coffee_name,
    br.name,
    b.roast_level,
    b.process,
    b.origin,
    b.photo_url,
    b.verification_status,
    (select count(*) from recipes r where r.bag_id = b.id),
    greatest(
      similarity(br.name || ' ' || b.coffee_name, q),
      similarity(b.coffee_name, q),
      similarity(br.name, q)
    ) as sim
  from bags b
  join brands br on br.id = b.brand_id
  where not b.flagged
    and (
      (br.name || ' ' || b.coffee_name) ilike '%' || q || '%'
      or similarity(br.name || ' ' || b.coffee_name, q) > 0.15
      or similarity(b.coffee_name, q) > 0.15
      or similarity(br.name, q) > 0.15
    )
  order by sim desc, b.created_at desc
  limit 12;
$$;

-- ============================================================
-- 8. Consensus RPC: per-brew-method aggregate, computed at request time
-- ============================================================
create or replace function public.bag_method_consensus(p_bag_id uuid)
returns table (
  brew_method public.brew_method,
  recipe_count bigint,
  avg_dose_g numeric,
  avg_yield_g numeric,
  avg_water_ml numeric,
  avg_brew_time_s numeric,
  avg_water_temp_c numeric,
  modal_grind public.grind_category,
  avg_rating numeric
)
language sql
stable
set search_path = public
as $$
  select
    r.brew_method,
    count(*),
    round(avg(r.dose_g), 1),
    round(avg(r.yield_g), 1),
    round(avg(r.water_ml), 0),
    round(avg(r.brew_time_s), 0),
    round(avg(r.water_temp_c), 1),
    mode() within group (order by r.grind_category),
    round(avg(r.rating), 2)
  from recipes r
  where r.bag_id = p_bag_id
  group by r.brew_method;
$$;
