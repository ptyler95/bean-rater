-- Homepage directory: filter + sort + paginate server-side.
-- When a brew-method filter is active, recipe_count/avg_rating are scoped to
-- that method and bags with no recipes for it are excluded; otherwise they
-- cover all of a bag's recipes. total_count repeats the full filtered count
-- on every row so the client can render a pager from one call.
create or replace function public.browse_bags(
  p_brand_slug text default null,
  p_brew_method public.brew_method default null,
  p_roast_level public.roast_level default null,
  p_sort text default 'newest',
  p_page integer default 1,
  p_page_size integer default 15
)
returns table (
  bag_id uuid,
  coffee_name text,
  origin text,
  roast_level public.roast_level,
  process public.process_method,
  verification_status public.verification_status,
  brand_name text,
  brand_slug text,
  recipe_count bigint,
  avg_rating numeric,
  created_at timestamptz,
  total_count bigint
)
language sql
stable
set search_path = public
as $$
  select
    b.id,
    b.coffee_name,
    b.origin,
    b.roast_level,
    b.process,
    b.verification_status,
    br.name,
    br.slug,
    count(r.id),
    round(avg(r.rating), 2),
    b.created_at,
    count(*) over ()
  from bags b
  join brands br on br.id = b.brand_id
  left join recipes r
    on r.bag_id = b.id
   and (p_brew_method is null or r.brew_method = p_brew_method)
  where not b.flagged
    and (p_brand_slug is null or br.slug = p_brand_slug)
    and (p_roast_level is null or b.roast_level = p_roast_level)
  group by b.id, br.name, br.slug
  having (p_brew_method is null or count(r.id) > 0)
  order by
    case when p_sort = 'top_rated' then avg(r.rating) end desc nulls last,
    case when p_sort = 'most_recipes' then count(r.id) end desc nulls last,
    b.created_at desc
  limit greatest(least(coalesce(p_page_size, 15), 50), 1)
  offset (greatest(coalesce(p_page, 1), 1) - 1)
    * greatest(least(coalesce(p_page_size, 15), 50), 1);
$$;
