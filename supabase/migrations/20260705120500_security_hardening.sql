-- Hardening pass from Supabase security advisors.

-- Pin search_path on the pre-existing updated_at trigger function.
alter function public.set_updated_at() set search_path = '';

-- Trigger functions are internal machinery; keep them off the public RPC surface.
revoke execute on function public.apply_bag_flag() from public, anon, authenticated;
revoke execute on function public.maintain_recipe_count() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- is_admin() intentionally stays executable: RLS policies evaluate it as the
-- querying role, so anon/authenticated need EXECUTE. It leaks nothing beyond
-- the caller's own admin status.

-- Keep extensions out of the public schema.
create schema if not exists extensions;
alter extension pg_trgm set schema extensions;
alter function public.search_bags(text) set search_path = public, extensions;
