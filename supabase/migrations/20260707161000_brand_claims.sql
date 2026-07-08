-- Roaster claim flow: users request a brand, admins approve.
-- Writes go through RPCs only (find_or_create_brand precedent) so the
-- table needs no insert/update policies.

create type public.claim_status as enum ('pending', 'approved', 'rejected');

create table public.brand_claims (
  id         uuid primary key default gen_random_uuid(),
  brand_id   uuid not null references public.brands (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  message    text not null check (char_length(message) between 10 and 1000),
  status     public.claim_status not null default 'pending',
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users (id) on delete set null
);

create unique index brand_claims_one_pending
  on public.brand_claims (brand_id, user_id) where status = 'pending';

alter table public.brand_claims enable row level security;

create policy "brand_claims: read own or admin" on public.brand_claims
  for select using (auth.uid() = user_id or public.is_admin());
create policy "brand_claims: withdraw own pending" on public.brand_claims
  for delete using (auth.uid() = user_id and status = 'pending');

-- ============================================================
-- request_brand_claim: any signed-in user asks to run a brand.
-- ============================================================
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
  if v_role in ('admin', 'brand_admin') then
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

revoke execute on function public.request_brand_claim(uuid, text) from public, anon;
grant execute on function public.request_brand_claim(uuid, text) to authenticated;

-- ============================================================
-- list_brand_claims: pending queue for admins (emails live in
-- auth.users, which the API can't read directly).
-- ============================================================
create or replace function public.list_brand_claims()
returns table (
  claim_id uuid,
  brand_name text,
  brand_slug text,
  brand_website text,
  claimant_email text,
  claimant_name text,
  message text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  return query
    select c.id, b.name, b.slug, b.website, u.email::text,
           p.display_name, c.message, c.created_at
    from public.brand_claims c
    join public.brands b on b.id = c.brand_id
    join auth.users u on u.id = c.user_id
    left join public.profiles p on p.user_id = c.user_id
    where c.status = 'pending'
    order by c.created_at;
end;
$$;

revoke execute on function public.list_brand_claims() from public, anon;
grant execute on function public.list_brand_claims() to authenticated;

-- ============================================================
-- resolve_brand_claim: approve promotes the claimant and marks
-- the brand claimed; other pending claims on the brand are
-- auto-rejected.
-- ============================================================
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
  if not public.is_admin() then
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
  if v_role = 'admin' then
    raise exception 'claimant is a full admin; assign brand admins manually';
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

revoke execute on function public.resolve_brand_claim(uuid, boolean) from public, anon;
grant execute on function public.resolve_brand_claim(uuid, boolean) to authenticated;

-- ============================================================
-- update_brand_profile: the only brand write path for roasters.
-- Column-whitelisted; name/slug/claimed/claimed_by stay unreachable.
-- ============================================================
create or replace function public.update_brand_profile(
  p_brand_id uuid,
  p_description text,
  p_website text,
  p_logo_url text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (public.is_brand_admin_for(p_brand_id) or public.is_admin()) then
    raise exception 'not authorized for this brand';
  end if;
  if p_website is not null and p_website !~* '^https?://' then
    raise exception 'website must be an http(s) URL';
  end if;
  if p_logo_url is not null and p_logo_url !~* '^https?://' then
    raise exception 'logo must be an http(s) URL';
  end if;

  update public.brands
     set description = nullif(trim(coalesce(p_description, '')), ''),
         website = p_website,
         logo_url = p_logo_url
   where id = p_brand_id;
end;
$$;

revoke execute on function public.update_brand_profile(uuid, text, text, text) from public, anon;
grant execute on function public.update_brand_profile(uuid, text, text, text) to authenticated;
