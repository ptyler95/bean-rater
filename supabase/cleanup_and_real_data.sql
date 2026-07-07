-- Bean Rater: remove demo seed data, insert real brands + bags.
-- Run in the Supabase SQL editor (elevated privileges; RLS/guard triggers
-- don't apply in that context). Idempotent: deletes target only the demo
-- seed UUIDs, inserts use fixed UUIDs with ON CONFLICT DO NOTHING.
--
-- Bag facts (origin, process, roast, sizes, URLs) were transcribed from the
-- roasters' published product info as of 2026-07-07. Fields the roaster
-- doesn't publish (altitude, varietal for blends) are left null rather than
-- guessed. No recipes are seeded — ratings/recipes should come from real use.
--
-- New bags are attributed to your account if it exists (ptyler95@gmail.com),
-- otherwise to the Archive sentinel user.

begin;

-- ------------------------------------------------------------
-- 1. Cleanup: demo seed data from supabase/seed.sql
--    (5 demo users, 4 fake brands, 13 bags, ~30 recipes, 3 flags)
--    Keeps: the Archive sentinel user and any real accounts/data.
-- ------------------------------------------------------------
delete from public.recipes where bag_id in (
  'c0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002',
  'c0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000004',
  'c0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000006',
  'c0000000-0000-4000-8000-000000000007', 'c0000000-0000-4000-8000-000000000008',
  'c0000000-0000-4000-8000-000000000009', 'c0000000-0000-4000-8000-000000000010',
  'c0000000-0000-4000-8000-000000000011', 'c0000000-0000-4000-8000-000000000012',
  'c0000000-0000-4000-8000-000000000013');

delete from public.bag_flags where bag_id in (
  'c0000000-0000-4000-8000-000000000013');

delete from public.bags where id in (
  'c0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002',
  'c0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000004',
  'c0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000006',
  'c0000000-0000-4000-8000-000000000007', 'c0000000-0000-4000-8000-000000000008',
  'c0000000-0000-4000-8000-000000000009', 'c0000000-0000-4000-8000-000000000010',
  'c0000000-0000-4000-8000-000000000011', 'c0000000-0000-4000-8000-000000000012',
  'c0000000-0000-4000-8000-000000000013');

-- Demo users (cascades their profiles; demo.otto's brand_admin link goes too).
-- The Archive user (a0000000-0000-4000-8000-00000000ffff) is NOT touched.
delete from auth.users where id in (
  'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002',
  'a0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000004',
  'a0000000-0000-4000-8000-000000000005');

delete from public.brands where id in (
  'b0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002',
  'b0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000004');

-- ------------------------------------------------------------
-- 2. Real brands
-- ------------------------------------------------------------
insert into public.brands (id, name, slug, website, claimed) values
  ('bb000000-0000-4000-8000-000000000001', 'Metric Coffee',           'metric-coffee',           'https://metriccoffee.com',           false),
  ('bb000000-0000-4000-8000-000000000002', 'Onyx Coffee Lab',         'onyx-coffee-lab',         'https://onyxcoffeelab.com',          false),
  ('bb000000-0000-4000-8000-000000000003', 'Dekáf Coffee Roasters',   'dekaf-coffee-roasters',   'https://dekaf.com',                  false),
  ('bb000000-0000-4000-8000-000000000004', 'Counter Culture Coffee',  'counter-culture-coffee',  'https://counterculturecoffee.com',   false),
  ('bb000000-0000-4000-8000-000000000005', 'Intelligentsia Coffee',   'intelligentsia-coffee',   'https://www.intelligentsia.com',     false),
  ('bb000000-0000-4000-8000-000000000006', 'Verve Coffee Roasters',   'verve-coffee-roasters',   'https://www.vervecoffee.com',        false)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 3. Real bags
--    Multi-process blends must pick one enum value; the defining component
--    was chosen (e.g. Monarch/Sermon lead with naturals). Swiss Water decaf
--    maps to 'other' (same convention as the old seed).
-- ------------------------------------------------------------
insert into public.bags
  (id, brand_id, added_by, coffee_name, roast_level, process, origin, region,
   bag_size, varietal, altitude_masl, product_url, verification_status)
select
  v.id::uuid, v.brand_id::uuid,
  coalesce(
    (select id from auth.users where email = 'ptyler95@gmail.com'),
    'a0000000-0000-4000-8000-00000000ffff'
  ),
  v.coffee_name, v.roast_level::public.roast_level,
  v.process::public.process_method, v.origin, v.region,
  v.bag_size, v.varietal, v.altitude_masl::integer, v.product_url,
  'community_verified'::public.verification_status
from (values
  -- Metric Coffee (Chicago, IL)
  ('cc000000-0000-4000-8000-000000000001', 'bb000000-0000-4000-8000-000000000001',
   'En Masse', 'medium', 'washed', 'Blend', null, null, null, null,
   'https://metriccoffee.com/products/en-masse'),
  ('cc000000-0000-4000-8000-000000000002', 'bb000000-0000-4000-8000-000000000001',
   'Quantum Espresso', 'medium', 'washed', 'Blend', null, null, null, null, null),
  ('cc000000-0000-4000-8000-000000000003', 'bb000000-0000-4000-8000-000000000001',
   'Big Riff', 'medium', 'natural', 'Blend', null, null, null, null, null),
  ('cc000000-0000-4000-8000-000000000004', 'bb000000-0000-4000-8000-000000000001',
   'Colossus', 'dark', 'washed', 'Blend', null, null, null, null, null),

  -- Onyx Coffee Lab (Rogers, AR) — 10oz boxes
  ('cc000000-0000-4000-8000-000000000005', 'bb000000-0000-4000-8000-000000000002',
   'Monarch', 'dark', 'natural', 'Blend', null, '10oz', null, null,
   'https://onyxcoffeelab.com/products/monarch'),
  ('cc000000-0000-4000-8000-000000000006', 'bb000000-0000-4000-8000-000000000002',
   'Southern Weather', 'medium', 'washed', 'Blend', null, '10oz', null, null,
   'https://onyxcoffeelab.com/products/southern-weather'),
  ('cc000000-0000-4000-8000-000000000007', 'bb000000-0000-4000-8000-000000000002',
   'Geometry', 'light', 'washed', 'Blend', null, '10oz', null, null,
   'https://onyxcoffeelab.com/products/geometry'),

  -- Dekáf Coffee Roasters (Cambridge, MA) — 100% Swiss Water decaf
  ('cc000000-0000-4000-8000-000000000008', 'bb000000-0000-4000-8000-000000000003',
   'Colombia Papayo (Decaf)', 'medium', 'other', 'Colombia', null, null, null, null,
   'https://dekaf.com/products/colombia-papayo'),
  ('cc000000-0000-4000-8000-000000000009', 'bb000000-0000-4000-8000-000000000003',
   'Midnight Mirage (Decaf)', 'medium_dark', 'other', 'Blend', null, null, null, null,
   'https://dekaf.com/products/midnight-mirage-signature-blend'),
  ('cc000000-0000-4000-8000-000000000010', 'bb000000-0000-4000-8000-000000000003',
   'Whisper Espresso (Low-Caf)', 'medium_light', 'other', 'Blend', null, null, null, null, null),

  -- Counter Culture Coffee (Durham, NC) — 12oz bags
  ('cc000000-0000-4000-8000-000000000011', 'bb000000-0000-4000-8000-000000000004',
   'Apollo', 'light', 'washed', 'Ethiopia', 'Yirgacheffe', '12oz', null, null, null),
  ('cc000000-0000-4000-8000-000000000012', 'bb000000-0000-4000-8000-000000000004',
   'Hologram', 'medium_light', 'natural', 'Blend', null, '12oz', null, null, null),
  ('cc000000-0000-4000-8000-000000000013', 'bb000000-0000-4000-8000-000000000004',
   'Big Trouble', 'medium', 'washed', 'Blend', null, '12oz', null, null, null),
  ('cc000000-0000-4000-8000-000000000014', 'bb000000-0000-4000-8000-000000000004',
   'Fast Forward', 'medium', 'washed', 'Blend', null, '12oz', null, null, null),

  -- Intelligentsia Coffee (Chicago, IL) — 12oz bags
  ('cc000000-0000-4000-8000-000000000015', 'bb000000-0000-4000-8000-000000000005',
   'Black Cat Classic Espresso', 'light', 'washed', 'Blend', null, '12oz', null, null,
   'https://www.intelligentsia.com/products/black-cat-classic-espresso'),
  ('cc000000-0000-4000-8000-000000000016', 'bb000000-0000-4000-8000-000000000005',
   'House Blend', 'medium', 'washed', 'Blend', null, '12oz', null, null, null),

  -- Verve Coffee Roasters (Santa Cruz, CA) — 12oz bags
  ('cc000000-0000-4000-8000-000000000017', 'bb000000-0000-4000-8000-000000000006',
   'Streetlevel', 'medium', 'washed', 'Blend', null, '12oz', null, null,
   'https://www.vervecoffee.com/products/streetlevel'),
  ('cc000000-0000-4000-8000-000000000018', 'bb000000-0000-4000-8000-000000000006',
   'Sermon', 'medium', 'natural', 'Blend', null, '12oz', null, null,
   'https://www.vervecoffee.com/products/sermon')
) as v(id, brand_id, coffee_name, roast_level, process, origin, region,
       bag_size, varietal, altitude_masl, product_url)
on conflict (id) do nothing;

commit;
