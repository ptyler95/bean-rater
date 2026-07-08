-- Public roaster pages: brand profile fields + a browse RPC.

alter table public.brands
  add column description text
  check (description is null or char_length(description) <= 600);

alter table public.brands
  add constraint brands_logo_url_scheme
  check (logo_url is null or logo_url ~* '^https?://');

-- One row per brand with catalog aggregates (non-flagged bags only).
-- claimed_by is deliberately not returned: the claimant's uuid is not public.
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
  left join recipes r on r.bag_id = b.id
  where p_slug is null or br.slug = p_slug
  group by br.id
  order by br.name;
$$;
