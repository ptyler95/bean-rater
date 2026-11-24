-- Any signed-in user could create unlimited brands through
-- find_or_create_brand. Record who created each brand and cap non-staff
-- users at 3 new brands per rolling 24 hours. Looking up an existing brand
-- never counts against the cap. Staff (admin, moderator) are exempt.

alter table public.brands
  add column created_by uuid references auth.users (id) on delete set null;

create index brands_created_by_created_at_idx
  on public.brands (created_by, created_at);

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

  -- Existing brand: return it, no cap check.
  select id into v_id from public.brands where slug = v_slug;
  if v_id is not null then
    return v_id;
  end if;

  if not public.is_admin()
     and (select count(*) from public.brands
           where created_by = auth.uid()
             and created_at > now() - interval '24 hours') >= 3 then
    raise exception 'you can add up to 3 new roasters per day';
  end if;

  insert into public.brands (name, slug, created_by)
  values (v_name, v_slug, auth.uid())
  on conflict (slug) do update set slug = excluded.slug
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.find_or_create_brand(text) from public, anon;
grant execute on function public.find_or_create_brand(text) to authenticated;
