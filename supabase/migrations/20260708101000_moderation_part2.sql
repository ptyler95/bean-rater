-- Role hierarchy + moderation, part 2: helpers, superadmin gates,
-- moderator management, banning, recipe flagging.

-- ============================================================
-- 1. Helpers. is_admin() now means "admin or moderator" — every
--    existing policy/trigger that referenced it grants moderators
--    moderation powers automatically (create or replace keeps the
--    OID). is_superadmin() gates anything that grants/revokes roles.
-- ============================================================
create or replace function public.is_superadmin()
returns boolean
language sql
stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$;
-- Stays executable by anon/authenticated for the same reason as
-- is_admin (RLS policies evaluate it as the querying role).

create or replace function public.is_admin()
returns boolean
language sql
stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role in ('admin', 'moderator')
  );
$$;

-- ============================================================
-- 2. Superadmin gate switches. Critical: both profiles policies
--    embedded is_admin() — left as-is, a moderator could promote
--    themselves (or anyone) to admin.
-- ============================================================
drop policy "profiles: admin full update" on public.profiles;
create policy "profiles: admin full update" on public.profiles
  for update using (public.is_superadmin());

drop policy "profiles: own update (role locked)" on public.profiles;
create policy "profiles: own update (role locked)" on public.profiles
  for update using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      public.is_superadmin()
      or (
        role = (select p.role from public.profiles p where p.user_id = auth.uid())
        and brand_id is not distinct from
            (select p.brand_id from public.profiles p where p.user_id = auth.uid())
      )
    )
  );

-- Brand-role assignment is superadmin-only, and never touches
-- admins/moderators (previously it could silently demote the owner).
create or replace function public.assign_brand_admin(p_email text, p_brand_slug text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_role public.user_role;
  v_brand uuid;
begin
  if not public.is_superadmin() then
    raise exception 'admin only';
  end if;

  select id into v_user from auth.users where lower(email) = lower(trim(p_email));
  if v_user is null then
    raise exception 'no user with email %', p_email;
  end if;

  select role into v_role from public.profiles where user_id = v_user;
  if v_role in ('admin', 'moderator') then
    raise exception 'target is an admin or moderator; change that role first';
  end if;

  if p_brand_slug is null then
    update public.profiles
       set role = 'user', brand_id = null
     where user_id = v_user and role = 'brand_admin';
    return;
  end if;

  select id into v_brand from public.brands where slug = p_brand_slug;
  if v_brand is null then
    raise exception 'no brand with slug %', p_brand_slug;
  end if;

  update public.profiles
     set role = 'brand_admin', brand_id = v_brand
   where user_id = v_user;
end;
$$;

-- Claim approval grants a brand role, so it is superadmin-only;
-- moderators keep the read-only queue via list_brand_claims.
create or replace function public.resolve_brand_claim(p_claim_id uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_claim record;
  v_role public.user_role;
  v_brand_id uuid;
begin
  if not public.is_superadmin() then
    raise exception 'admin only';
  end if;

  select * into v_claim from public.brand_claims
   where id = p_claim_id and status = 'pending'
   for update;
  if v_claim is null then
    raise exception 'no pending claim with that id';
  end if;

  if not p_approve then
    update public.brand_claims
       set status = 'rejected', decided_at = now(), decided_by = auth.uid()
     where id = p_claim_id;
    return;
  end if;

  if (select claimed from public.brands where id = v_claim.brand_id) then
    raise exception 'brand is already claimed';
  end if;

  select role, brand_id into v_role, v_brand_id
    from public.profiles where user_id = v_claim.user_id;
  if v_role is null then
    raise exception 'claimant profile no longer exists';
  end if;
  if v_role in ('admin', 'moderator') then
    raise exception 'claimant is staff; assign brand admins manually';
  end if;
  if v_role = 'brand_admin' and v_brand_id is distinct from v_claim.brand_id then
    raise exception 'claimant already administers another brand';
  end if;

  update public.brands
     set claimed = true, claimed_by = v_claim.user_id
   where id = v_claim.brand_id;

  update public.profiles
     set role = 'brand_admin', brand_id = v_claim.brand_id
   where user_id = v_claim.user_id;

  update public.brand_claims
     set status = 'approved', decided_at = now(), decided_by = auth.uid()
   where id = p_claim_id;

  update public.brand_claims
     set status = 'rejected', decided_at = now(), decided_by = auth.uid()
   where brand_id = v_claim.brand_id and status = 'pending' and id <> p_claim_id;
end;
$$;

-- Staff shouldn't file claims either.
create or replace function public.request_brand_claim(p_brand_id uuid, p_message text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_claimed boolean;
  v_role public.user_role;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select claimed into v_claimed from public.brands where id = p_brand_id;
  if v_claimed is null then
    raise exception 'no such brand';
  end if;
  if v_claimed then
    raise exception 'this roaster is already claimed';
  end if;

  select role into v_role from public.profiles where user_id = auth.uid();
  if v_role in ('admin', 'moderator', 'brand_admin') then
    raise exception 'your account already manages a roaster';
  end if;

  if (select count(*) from public.brand_claims
       where user_id = auth.uid() and status = 'pending') >= 3 then
    raise exception 'you already have 3 claims pending review';
  end if;

  insert into public.brand_claims (brand_id, user_id, message)
  values (p_brand_id, auth.uid(), trim(p_message));
end;
$$;

-- ============================================================
-- 3. Moderator management (superadmin-only, by email).
-- ============================================================
create or replace function public.assign_moderator(p_email text, p_revoke boolean default false)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_role public.user_role;
begin
  if not public.is_superadmin() then
    raise exception 'admin only';
  end if;

  select id into v_user from auth.users where lower(email) = lower(trim(p_email));
  if v_user is null then
    raise exception 'no user with email %', p_email;
  end if;

  select role into v_role from public.profiles where user_id = v_user;

  if p_revoke then
    update public.profiles set role = 'user'
     where user_id = v_user and role = 'moderator';
    return;
  end if;

  if v_role = 'admin' then
    raise exception 'target is the site admin';
  end if;
  if v_role = 'brand_admin' then
    raise exception 'target is a brand admin; revoke that role first';
  end if;

  update public.profiles set role = 'moderator' where user_id = v_user;
end;
$$;

revoke execute on function public.assign_moderator(text, boolean) from public, anon;
grant execute on function public.assign_moderator(text, boolean) to authenticated;

create or replace function public.list_moderators()
returns table (email text, display_name text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_superadmin() then
    raise exception 'admin only';
  end if;
  return query
    select u.email::text, p.display_name
    from public.profiles p
    join auth.users u on u.id = p.user_id
    where p.role = 'moderator'
    order by u.email;
end;
$$;

revoke execute on function public.list_moderators() from public, anon;
grant execute on function public.list_moderators() to authenticated;

-- ============================================================
-- 4. Banning (moderators and up). banned_until blocks magic-link
--    sign-in and token refresh; deleting sessions cuts refresh
--    tokens so only pre-issued access JWTs (~1h) survive.
-- ============================================================
create or replace function public.set_user_ban(p_email text, p_banned boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_role public.user_role;
begin
  if not public.is_admin() then
    raise exception 'moderator only';
  end if;

  select id into v_user from auth.users where lower(email) = lower(trim(p_email));
  if v_user is null then
    raise exception 'no user with email %', p_email;
  end if;
  if v_user = 'a0000000-0000-4000-8000-00000000ffff' then
    raise exception 'cannot ban the archive user';
  end if;

  select role into v_role from public.profiles where user_id = v_user;
  if v_role in ('admin', 'moderator') then
    raise exception 'cannot ban staff';
  end if;

  if p_banned then
    update auth.users set banned_until = '2200-01-01T00:00:00Z' where id = v_user;
    delete from auth.sessions where user_id = v_user;
  else
    update auth.users set banned_until = null where id = v_user;
  end if;
end;
$$;

revoke execute on function public.set_user_ban(text, boolean) from public, anon;
grant execute on function public.set_user_ban(text, boolean) to authenticated;

create or replace function public.list_banned_users()
returns table (email text, display_name text, banned_until timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'moderator only';
  end if;
  return query
    select u.email::text, p.display_name, u.banned_until
    from auth.users u
    left join public.profiles p on p.user_id = u.id
    where u.banned_until > now()
    order by u.email;
end;
$$;

revoke execute on function public.list_banned_users() from public, anon;
grant execute on function public.list_banned_users() to authenticated;

-- ============================================================
-- 5. Recipe flagging (mirrors the bag pattern from
--    20260706180500_moderation_policies.sql).
-- ============================================================
alter table public.recipes
  add column flagged boolean not null default false,
  add column flag_count integer not null default 0;

create table public.recipe_flags (
  recipe_id  uuid not null references public.recipes (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (recipe_id, user_id)
);

alter table public.recipe_flags enable row level security;

create policy "recipe_flags: authed insert" on public.recipe_flags
  for insert to authenticated
  with check (auth.uid() = user_id);
create policy "recipe_flags: read own or admin" on public.recipe_flags
  for select using (auth.uid() = user_id or public.is_admin());
create policy "recipe_flags: admin delete" on public.recipe_flags
  for delete using (public.is_admin());

create or replace function public.apply_recipe_flag()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform set_config('app.recipe_flag_trigger', 'on', true);
  update public.recipes
     set flag_count = flag_count + 1,
         flagged    = (flag_count + 1) >= 3
   where id = new.recipe_id;
  perform set_config('app.recipe_flag_trigger', '', true);
  return new;
end;
$$;

create trigger recipe_flags_apply
  after insert on public.recipe_flags
  for each row execute function public.apply_recipe_flag();

create or replace function public.protect_recipe_moderation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(current_setting('app.recipe_flag_trigger', true), '') = 'on'
     or auth.uid() is null then
    return new;
  end if;
  if not public.is_admin() then
    new.flagged := old.flagged;
    new.flag_count := old.flag_count;
  end if;
  return new;
end;
$$;

create trigger recipes_protect_moderation
  before update on public.recipes
  for each row execute function public.protect_recipe_moderation();

revoke execute on function public.apply_recipe_flag() from public, anon, authenticated;
revoke execute on function public.protect_recipe_moderation() from public, anon, authenticated;

-- Public read excludes flagged recipes (author and staff still see them);
-- inserts can't arrive pre-flagged.
drop policy "recipes: public read" on public.recipes;
create policy "recipes: public read non-flagged" on public.recipes
  for select using ((not flagged) or public.is_admin() or user_id = auth.uid());

drop policy "recipes: own insert" on public.recipes;
create policy "recipes: own insert" on public.recipes
  for insert with check (auth.uid() = user_id and flagged = false and flag_count = 0);

-- ============================================================
-- 6. Flagged recipes drop out of every aggregate.
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
  where r.bag_id = p_bag_id and not r.flagged
  group by r.brew_method;
$$;

create or replace function public.browse_bags(
  p_brand_slug text default null,
  p_brew_method public.brew_method default null,
  p_roast_level public.roast_level default null,
  p_sort text default 'newest',
  p_page integer default 1,
  p_page_size integer default 15
)
returns table (
  bag_id uuid,
  coffee_name text,
  origin text,
  roast_level public.roast_level,
  process public.process_method,
  verification_status public.verification_status,
  brand_name text,
  brand_slug text,
  recipe_count bigint,
  avg_rating numeric,
  created_at timestamptz,
  total_count bigint
)
language sql
stable
set search_path = public
as $$
  select
    b.id,
    b.coffee_name,
    b.origin,
    b.roast_level,
    b.process,
    b.verification_status,
    br.name,
    br.slug,
    count(r.id),
    round(avg(r.rating), 2),
    b.created_at,
    count(*) over ()
  from bags b
  join brands br on br.id = b.brand_id
  left join recipes r
    on r.bag_id = b.id
   and not r.flagged
   and (p_brew_method is null or r.brew_method = p_brew_method)
  where not b.flagged
    and (p_brand_slug is null or br.slug = p_brand_slug)
    and (p_roast_level is null or b.roast_level = p_roast_level)
  group by b.id, br.name, br.slug
  having (p_brew_method is null or count(r.id) > 0)
  order by
    case when p_sort = 'top_rated' then avg(r.rating) end desc nulls last,
    case when p_sort = 'most_recipes' then count(r.id) end desc nulls last,
    b.created_at desc
  limit greatest(least(coalesce(p_page_size, 15), 50), 1)
  offset (greatest(coalesce(p_page, 1), 1) - 1)
    * greatest(least(coalesce(p_page_size, 15), 50), 1);
$$;

create or replace function public.browse_roasters(p_slug text default null)
returns table (
  brand_id uuid,
  name text,
  slug text,
  website text,
  logo_url text,
  description text,
  claimed boolean,
  bag_count bigint,
  recipe_count bigint,
  avg_rating numeric
)
language sql
stable
set search_path = public
as $$
  select
    br.id,
    br.name,
    br.slug,
    br.website,
    br.logo_url,
    br.description,
    br.claimed,
    count(distinct b.id),
    count(r.id),
    round(avg(r.rating), 2)
  from brands br
  left join bags b on b.brand_id = br.id and not b.flagged
  left join recipes r on r.bag_id = b.id and not r.flagged
  where p_slug is null or br.slug = p_slug
  group by br.id
  order by br.name;
$$;

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
set search_path = public, extensions
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
    (select count(*) from recipes r where r.bag_id = b.id and not r.flagged),
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
-- 7. profiles.recipe_count counts visible recipes only.
-- ============================================================
create or replace function public.maintain_recipe_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if not new.flagged then
      update public.profiles
         set recipe_count = recipe_count + 1
       where user_id = new.user_id;
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    if not old.flagged then
      update public.profiles
         set recipe_count = greatest(recipe_count - 1, 0)
       where user_id = old.user_id;
    end if;
    return old;
  elsif tg_op = 'UPDATE' then
    if old.flagged and not new.flagged then
      update public.profiles
         set recipe_count = recipe_count + 1
       where user_id = new.user_id;
    elsif not old.flagged and new.flagged then
      update public.profiles
         set recipe_count = greatest(recipe_count - 1, 0)
       where user_id = new.user_id;
    end if;
    return new;
  end if;
  return null;
end;
$$;

drop trigger recipes_maintain_count on public.recipes;
create trigger recipes_maintain_count
  after insert or delete or update of flagged on public.recipes
  for each row execute function public.maintain_recipe_count();

-- Defensive recount (no flagged rows exist yet, so this is a no-op
-- that makes the migration self-consistent).
update public.profiles p
   set recipe_count = (
     select count(*) from public.recipes r
     where r.user_id = p.user_id and not r.flagged
   )
 where p.recipe_count is distinct from (
     select count(*) from public.recipes r
     where r.user_id = p.user_id and not r.flagged
   );
