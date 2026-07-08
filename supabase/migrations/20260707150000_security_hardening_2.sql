-- Launch security review fixes.

-- ============================================================
-- 1. A brand admin could reassign their own profiles.brand_id and
--    become admin of any brand: the own-update policy locked role
--    but not brand_id. Lock both (admins still manage freely, and
--    assign_brand_admin runs as owner so it bypasses RLS).
-- ============================================================
drop policy "profiles: own update (role locked)" on public.profiles;
create policy "profiles: own update (role locked)" on public.profiles
  for update using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      public.is_admin()
      or (
        role = (select p.role from public.profiles p where p.user_id = auth.uid())
        and brand_id is not distinct from
            (select p.brand_id from public.profiles p where p.user_id = auth.uid())
      )
    )
  );

-- ============================================================
-- 2. The moderation guard reverted flagged/flag_count for
--    non-admins but not verification_status or added_by, so a
--    brand admin could mark their own bags 'community_verified'
--    or spoof attribution. Only full admins may grant the
--    community tier or reattribute a bag.
-- ============================================================
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
    new.added_by := old.added_by;
    if new.verification_status = 'community_verified'
       and old.verification_status is distinct from 'community_verified' then
      new.verification_status := old.verification_status;
    end if;
  end if;
  return new;
end;
$$;

-- ============================================================
-- 3. Let users rename themselves: the signup default is the email
--    local-part, which is public via profiles. (Policy already
--    allows own-row updates; this is just a length guard.)
-- ============================================================
alter table public.profiles
  add constraint profiles_display_name_length
  check (char_length(display_name) between 1 and 40);
