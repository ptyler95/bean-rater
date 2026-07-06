-- Controlled write path for brands: the add-bag flow needs to reference new
-- roasters, but direct table writes on brands stay locked. This RPC only
-- creates (name, slug); website/logo/claimed remain admin-managed. The
-- on-conflict upsert makes concurrent find-or-create atomic.
create or replace function public.find_or_create_brand(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := trim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  v_slug text;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if length(v_name) < 2 or length(v_name) > 80 then
    raise exception 'brand name must be 2-80 characters';
  end if;
  v_slug := trim(both '-' from regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g'));
  if v_slug = '' then
    raise exception 'brand name must contain letters or numbers';
  end if;

  insert into public.brands (name, slug)
  values (v_name, v_slug)
  on conflict (slug) do update set slug = excluded.slug
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.find_or_create_brand(text) from public, anon;
grant execute on function public.find_or_create_brand(text) to authenticated;
