-- Moderation groundwork, part 1 of 2 (enum values can't be used in the same
-- transaction they're created in, so policies land in part 2).

-- ============================================================
-- 1. brand_admin role + brand attachment
-- ============================================================
alter type public.user_role add value if not exists 'brand_admin';

alter table public.profiles
  add column brand_id uuid references public.brands (id) on delete set null;

-- ============================================================
-- 2. Genericize v60 -> pour_over (existing rows rename with it;
--    the specific brewer already lives in recipes.machine_model)
-- ============================================================
alter type public.brew_method rename value 'v60' to 'pour_over';

-- ============================================================
-- 3. Archive user: deleted accounts leave their content behind,
--    reassigned to a sentinel the admins control.
-- ============================================================
insert into auth.users
  (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
   confirmation_token, recovery_token, email_change, email_change_token_new)
values
  ('a0000000-0000-4000-8000-00000000ffff', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'archive@beanrater.local',
   extensions.crypt(extensions.gen_random_uuid()::text, extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Archive"}',
   now(), now(), '', '', '', '');

-- Profiles die with their auth user; content does not.
alter table public.profiles drop constraint profiles_id_fkey;
alter table public.profiles
  add constraint profiles_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.recipes alter column user_id
  set default 'a0000000-0000-4000-8000-00000000ffff';
alter table public.recipes drop constraint recipes_user_id_fkey;
alter table public.recipes
  add constraint recipes_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete set default;
alter table public.recipes drop constraint recipes_user_profile_fkey;
alter table public.recipes
  add constraint recipes_user_profile_fkey
  foreign key (user_id) references public.profiles (user_id) on delete set default;

alter table public.bags alter column added_by
  set default 'a0000000-0000-4000-8000-00000000ffff';
alter table public.bags drop constraint bags_created_by_fkey;
alter table public.bags
  add constraint bags_added_by_fkey
  foreign key (added_by) references auth.users (id) on delete set default;

alter table public.brands drop constraint brands_claimed_by_fkey;
alter table public.brands
  add constraint brands_claimed_by_fkey
  foreign key (claimed_by) references auth.users (id) on delete set null;

-- ============================================================
-- 4. Security: outbound links must be web URLs (no javascript:)
-- ============================================================
alter table public.bags
  add constraint bags_product_url_scheme
  check (product_url is null or product_url ~* '^https?://');
alter table public.brands
  add constraint brands_website_scheme
  check (website is null or website ~* '^https?://');
