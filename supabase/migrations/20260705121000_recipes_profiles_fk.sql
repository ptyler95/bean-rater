-- Enable PostgREST embedding of the author profile on recipes.
-- Additive: the spec's FK to auth.users remains; every auth user has a
-- profile row via the handle_new_user trigger, so this constraint holds.
alter table public.recipes
  add constraint recipes_user_profile_fkey
  foreign key (user_id) references public.profiles (user_id);
