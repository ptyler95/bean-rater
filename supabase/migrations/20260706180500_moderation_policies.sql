-- Moderation groundwork, part 2: brand-admin policies, moderation guard,
-- admin recipe controls, brand-admin assignment RPC.

-- ============================================================
-- 1. Helper: is the caller the brand admin for this brand?
-- ============================================================
create or replace function public.is_brand_admin_for(p_brand_id uuid)
returns boolean
language sql
stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid()
      and role = 'brand_admin'
      and brand_id = p_brand_id
  );
$$;

-- ============================================================
-- 2. Bags: brand admins see and manage their own brand's bags
-- ============================================================
drop policy "bags: public read non-flagged" on public.bags;
create policy "bags: public read non-flagged" on public.bags
  for select using (
    (not flagged)
    or public.is_admin()
    or added_by = auth.uid()
    or public.is_brand_admin_for(brand_id)
  );

-- Brand admins may add their own brand's bags as roaster_verified;
-- everyone else still starts unverified.
drop policy "bags: authed insert" on public.bags;
create policy "bags: authed insert" on public.bags
  for insert to authenticated
  with check (
    auth.uid() = added_by
    and flagged = false
    and flag_count = 0
    and (
      verification_status = 'unverified'
      or (verification_status = 'roaster_verified'
          and public.is_brand_admin_for(brand_id))
    )
  );

create policy "bags: brand admin update" on public.bags
  for update using (public.is_brand_admin_for(brand_id))
  with check (public.is_brand_admin_for(brand_id));

-- ============================================================
-- 3. Guard: only full admins touch moderation fields. The flag
--    trigger marks itself via a transaction-local GUC so its own
--    update passes through.
-- ============================================================
create or replace function public.apply_bag_flag()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform set_config('app.flag_trigger', 'on', true);
  update public.bags
     set flag_count = flag_count + 1,
         flagged    = (flag_count + 1) >= 3
   where id = new.bag_id;
  perform set_config('app.flag_trigger', '', true);
  return new;
end;
$$;

create or replace function public.protect_bag_moderation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Service contexts (no auth.uid()) bypass RLS anyway; guard only end users.
  if coalesce(current_setting('app.flag_trigger', true), '') = 'on'
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

create trigger bags_protect_moderation
  before update on public.bags
  for each row execute function public.protect_bag_moderation();

revoke execute on function public.protect_bag_moderation() from public, anon, authenticated;

-- ============================================================
-- 4. Admins can moderate any recipe (incl. archived users' recipes)
--    and reset flag reports when republishing a bag.
-- ============================================================
create policy "recipes: admin update" on public.recipes
  for update using (public.is_admin());
create policy "recipes: admin delete" on public.recipes
  for delete using (public.is_admin());
create policy "bag_flags: admin delete" on public.bag_flags
  for delete using (public.is_admin());

-- ============================================================
-- 5. Brand-admin assignment (admin-only, by email + brand slug;
--    null slug demotes back to a regular user)
-- ============================================================
create or replace function public.assign_brand_admin(p_email text, p_brand_slug text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_brand uuid;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;

  select id into v_user from auth.users where lower(email) = lower(trim(p_email));
  if v_user is null then
    raise exception 'no user with email %', p_email;
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

revoke execute on function public.assign_brand_admin(text, text) from public, anon;
grant execute on function public.assign_brand_admin(text, text) to authenticated;

-- Admin-only listing of current brand admins (emails live in auth.users,
-- which the API can't read directly).
create or replace function public.list_brand_admins()
returns table (email text, display_name text, brand_name text, brand_slug text)
language plpgsql
stable security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  return query
    select u.email::text, p.display_name, b.name, b.slug
    from public.profiles p
    join auth.users u on u.id = p.user_id
    left join public.brands b on b.id = p.brand_id
    where p.role = 'brand_admin'
    order by b.name nulls last, u.email;
end;
$$;

revoke execute on function public.list_brand_admins() from public, anon;
grant execute on function public.list_brand_admins() to authenticated;
