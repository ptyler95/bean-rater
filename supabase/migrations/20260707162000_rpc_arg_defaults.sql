-- Generated TS types mark only defaulted args optional; give the two RPCs
-- with "nullable" args proper defaults so callers can just omit them.

-- Demotion = omit p_brand_slug.
create or replace function public.assign_brand_admin(p_email text, p_brand_slug text default null)
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

-- Blank fields clear the column; callers always send strings.
create or replace function public.update_brand_profile(
  p_brand_id uuid,
  p_description text default null,
  p_website text default null,
  p_logo_url text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_description text := nullif(trim(coalesce(p_description, '')), '');
  v_website text := nullif(trim(coalesce(p_website, '')), '');
  v_logo text := nullif(trim(coalesce(p_logo_url, '')), '');
begin
  if not (public.is_brand_admin_for(p_brand_id) or public.is_admin()) then
    raise exception 'not authorized for this brand';
  end if;
  if v_website is not null and v_website !~* '^https?://' then
    raise exception 'website must be an http(s) URL';
  end if;
  if v_logo is not null and v_logo !~* '^https?://' then
    raise exception 'logo must be an http(s) URL';
  end if;

  update public.brands
     set description = v_description,
         website = v_website,
         logo_url = v_logo
   where id = p_brand_id;
end;
$$;
