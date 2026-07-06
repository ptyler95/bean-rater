-- Bean Rater demo seed.
-- Run against the remote project with elevated (postgres) privileges, e.g.
-- via the Supabase SQL editor or MCP execute_sql. Idempotent-ish: it aborts
-- if the demo users already exist.
--
-- Creates: 5 demo users, 4 brands, 13 bags, ~30 recipes.
-- Several bag/brew-method combos have >= 3 recipes so the consensus card renders.
-- One bag is flagged by 3 users so the /admin queue is non-empty.

begin;

-- ------------------------------------------------------------
-- Demo users (never log in; passwords are throwaway)
-- ------------------------------------------------------------
insert into auth.users
  (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
   confirmation_token, recovery_token, email_change, email_change_token_new)
values
  ('a0000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'demo.mara@beanrater.local', extensions.crypt(extensions.gen_random_uuid()::text, extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Mara K."}', now() - interval '90 days', now(), '', '', '', ''),
  ('a0000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'demo.jules@beanrater.local', extensions.crypt(extensions.gen_random_uuid()::text, extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Jules P."}', now() - interval '85 days', now(), '', '', '', ''),
  ('a0000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'demo.dev@beanrater.local', extensions.crypt(extensions.gen_random_uuid()::text, extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Devon R."}', now() - interval '80 days', now(), '', '', '', ''),
  ('a0000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'demo.sana@beanrater.local', extensions.crypt(extensions.gen_random_uuid()::text, extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Sana T."}', now() - interval '60 days', now(), '', '', '', ''),
  ('a0000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'demo.otto@beanrater.local', extensions.crypt(extensions.gen_random_uuid()::text, extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Otto B."}', now() - interval '45 days', now(), '', '', '', '');

-- ------------------------------------------------------------
-- Brands
-- ------------------------------------------------------------
insert into public.brands (id, name, slug, website, claimed) values
  ('b0000000-0000-4000-8000-000000000001', 'Cascade Roasting Co.', 'cascade-roasting-co', 'https://cascaderoasting.example', false),
  ('b0000000-0000-4000-8000-000000000002', 'Meridian Coffee Works', 'meridian-coffee-works', 'https://meridiancoffee.example', true),
  ('b0000000-0000-4000-8000-000000000003', 'Little Giant Coffee', 'little-giant-coffee', 'https://littlegiant.example', false),
  ('b0000000-0000-4000-8000-000000000004', 'First Light Roasters', 'first-light-roasters', null, false);

-- ------------------------------------------------------------
-- Bags
-- ------------------------------------------------------------
insert into public.bags
  (id, brand_id, added_by, coffee_name, roast_level, process, origin, region, bag_size, varietal, altitude_masl, verification_status, created_at)
values
  -- Cascade Roasting Co.
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'Yirgacheffe Kochere', 'light', 'washed', 'Ethiopia', 'Yirgacheffe', '250g', 'Heirloom', 1950, 'roaster_verified', now() - interval '80 days'),
  ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002',
   'Huila Decaf', 'medium', 'other', 'Colombia', 'Huila', '340g', 'Castillo', 1600, 'unverified', now() - interval '70 days'),
  ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'Midnight Ridge Blend', 'dark', 'natural', 'Brazil', 'Cerrado', '340g', null, 1100, 'community_verified', now() - interval '65 days'),
  -- Meridian Coffee Works
  ('c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000003',
   'Nyeri AA Gatuya', 'light', 'washed', 'Kenya', 'Nyeri', '250g', 'SL28, SL34', 1800, 'roaster_verified', now() - interval '60 days'),
  ('c0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002',
   'La Esperanza Honey', 'medium_light', 'honey', 'Costa Rica', 'Tarrazú', '250g', 'Catuai', 1700, 'unverified', now() - interval '55 days'),
  ('c0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000004',
   'Espresso No. 9', 'medium_dark', 'washed', 'Blend', null, '1kg', null, null, 'community_verified', now() - interval '50 days'),
  ('c0000000-0000-4000-8000-000000000007', 'b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000005',
   'Gedeb Anaerobic Lot 41', 'light', 'anaerobic', 'Ethiopia', 'Gedeb', '200g', '74158', 2100, 'unverified', now() - interval '40 days'),
  -- Little Giant Coffee
  ('c0000000-0000-4000-8000-000000000008', 'b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000003',
   'El Paraiso Gesha', 'light', 'washed', 'Colombia', 'Cauca', '100g', 'Gesha', 1930, 'unverified', now() - interval '35 days'),
  ('c0000000-0000-4000-8000-000000000009', 'b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000004',
   'House Comet Blend', 'medium', 'washed', 'Blend', null, '340g', null, null, 'unverified', now() - interval '30 days'),
  ('c0000000-0000-4000-8000-000000000010', 'b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001',
   'Sumatra Wahana Estate', 'medium_dark', 'natural', 'Indonesia', 'North Sumatra', '340g', 'Rasuna', 1250, 'unverified', now() - interval '25 days'),
  -- First Light Roasters
  ('c0000000-0000-4000-8000-000000000011', 'b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000005',
   'Antigua Bourbon', 'medium', 'washed', 'Guatemala', 'Antigua', '340g', 'Bourbon', 1550, 'unverified', now() - interval '20 days'),
  ('c0000000-0000-4000-8000-000000000012', 'b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002',
   'Cold Snap Cold Brew Blend', 'dark', 'natural', 'Blend', null, '900g', null, null, 'unverified', now() - interval '15 days'),
  -- Spam entry that the community flagged (ends up in /admin queue)
  ('c0000000-0000-4000-8000-000000000013', 'b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000005',
   'TOTALLY REAL Kopi Luwak 99% OFF', 'dark', 'other', 'Unknown', null, null, null, null, 'unverified', now() - interval '10 days');

-- ------------------------------------------------------------
-- Recipes
-- ------------------------------------------------------------
-- Consensus combos (>= 3 recipes):
--   Yirgacheffe Kochere / v60 (4), Espresso No. 9 / espresso (4),
--   Nyeri AA / v60 (3), House Comet / aeropress (3), Midnight Ridge / french_press (3)
insert into public.recipes
  (bag_id, user_id, brew_method, dose_g, yield_g, water_ml, brew_time_s, water_temp_c,
   grind_category, rating, notes, freshness_offset, grinder_model, machine_model, burr_type, created_at)
values
  -- Yirgacheffe Kochere: 4x v60 + 1 aeropress
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'pour_over', 15, null, 250, 165, 94, 'medium_fine', 5,
   'Blooms huge. Florals pop at 94°C, went muddy any finer.', 'under_7', 'Comandante C40', 'Hario V60 02', 'conical', now() - interval '75 days'),
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'pour_over', 18, null, 300, 180, 93, 'medium_fine', 4,
   'Classic 1:16.7. Jasmine and lemon curd.', '7_to_14', 'Fellow Ode Gen 2', 'Hario V60 02', 'flat', now() - interval '70 days'),
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', 'pour_over', 20, null, 320, 195, 95, 'medium', 4,
   'Coarser + hotter = sweeter cup for me.', 'under_7', 'Baratza Encore ESP', 'Hario V60 03', 'conical', now() - interval '55 days'),
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004', 'pour_over', 15, null, 240, 150, 92, 'medium_fine', 5,
   'Fast single-pour, no bypass. Tea-like.', '14_to_21', '1Zpresso JX-Pro', null, 'conical', now() - interval '30 days'),
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000005', 'aeropress', 16, null, 230, 120, 88, 'medium_fine', 4,
   'Inverted, 2 min steep, slow press.', '7_to_14', 'Comandante C40', 'AeroPress', 'conical', now() - interval '20 days'),

  -- Espresso No. 9: 4x espresso
  ('c0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000001', 'espresso', 18, 36, null, 28, 93, 'fine', 4,
   '1:2 in 28s. Chocolate bomb, holds up in milk.', 'under_7', 'Niche Zero', 'Gaggia Classic Pro', 'conical', now() - interval '48 days'),
  ('c0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000002', 'espresso', 18, 40, null, 30, 92, 'fine', 5,
   'Slightly longer ratio tames the roast. Caramel finish.', '7_to_14', 'DF64', 'Breville Bambino Plus', 'flat', now() - interval '45 days'),
  ('c0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000004', 'espresso', 18.5, 38, null, 26, 94, 'fine', 4,
   'Updosed a touch, WDT, 26s. Very forgiving.', 'under_7', 'Eureka Mignon Specialita', 'Rancilio Silvia', 'flat', now() - interval '38 days'),
  ('c0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000005', 'espresso', 17.5, 35, null, 32, 93, 'extra_fine', 3,
   'Ran it tighter — got some bitterness, backing off next bag.', '14_to_21', 'Niche Zero', 'La Marzocco Linea Micra', 'conical', now() - interval '22 days'),

  -- Nyeri AA: 3x v60 + 1 espresso
  ('c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002', 'pour_over', 15, null, 250, 170, 96, 'medium_fine', 5,
   'Blackcurrant for days. Needs the heat.', 'under_7', 'Comandante C40', 'Hario V60 02', 'conical', now() - interval '52 days'),
  ('c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000003', 'pour_over', 22, null, 360, 210, 94, 'medium', 4,
   'Big batch for two. Juicy, tomato-sweet acidity.', '7_to_14', 'Fellow Ode Gen 2', 'Hario V60 03', 'flat', now() - interval '44 days'),
  ('c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000005', 'pour_over', 16, null, 260, 175, 95, 'medium_fine', 5,
   'Five pours of 52g. Best Kenyan this year.', 'under_7', '1Zpresso JX-Pro', null, 'conical', now() - interval '28 days'),
  ('c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'espresso', 18, 45, null, 30, 94, 'fine', 3,
   'Turbo-ish shot. Bright but a bit sharp as espresso.', '14_to_21', 'DF64', 'Breville Bambino Plus', 'flat', now() - interval '18 days'),

  -- House Comet Blend: 3x aeropress
  ('c0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000001', 'aeropress', 15, null, 220, 105, 90, 'medium_fine', 4,
   'Standard, 90s steep, 15s press. Easy daily cup.', '7_to_14', 'Baratza Encore', 'AeroPress', 'conical', now() - interval '26 days'),
  ('c0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000004', 'aeropress', 17, null, 240, 150, 92, 'medium', 4,
   'Inverted, longer steep, coarser. Rounder body.', 'under_7', '1Zpresso Q2', 'AeroPress', 'conical', now() - interval '19 days'),
  ('c0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000002', 'aeropress', 16, null, 230, 120, 91, 'medium_fine', 5,
   'Prismo, no bypass, tastes like a clean french press.', '7_to_14', 'Fellow Ode Gen 2', 'AeroPress + Prismo', 'flat', now() - interval '12 days'),

  -- Midnight Ridge: 3x french press + 1 moka pot
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000003', 'french_press', 30, null, 500, 240, 95, 'coarse', 4,
   '4 min, break crust, no plunge — just pour. Cocoa heavy.', '14_to_21', 'Baratza Encore', 'Bodum Chambord', 'conical', now() - interval '58 days'),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000005', 'french_press', 32, null, 520, 300, 94, 'coarse', 4,
   'Hoffmann method, 5 min. Zero sludge.', 'over_21', 'Wilfa Svart', 'Bodum Chambord', 'flat', now() - interval '41 days'),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'french_press', 28, null, 450, 240, 96, 'extra_coarse', 3,
   'Went very coarse — thin. Will tighten next time.', '7_to_14', 'Baratza Encore', null, 'conical', now() - interval '24 days'),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002', 'moka_pot', 17, 60, 100, 210, 95, 'fine', 4,
   'Preheated water, low flame. Syrupy, not burnt.', 'under_7', '1Zpresso J-Max', 'Bialetti Moka Express 3-cup', 'conical', now() - interval '14 days'),

  -- Below-threshold combos (individual recipe lists)
  ('c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000002', 'pour_over', 15, null, 250, 160, 93, 'medium_fine', 4,
   'Honey sweetness carries. Medium-fine on the C40.', 'under_7', 'Comandante C40', 'Hario V60 02', 'conical', now() - interval '50 days'),
  ('c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000004', 'aeropress', 16, null, 240, 135, 89, 'medium_fine', 5,
   'Cooler water keeps it syrupy.', '7_to_14', '1Zpresso Q2', 'AeroPress', 'conical', now() - interval '33 days'),
  ('c0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000005', 'pour_over', 15, null, 255, 185, 92, 'medium', 5,
   'Wild ferment funk, strawberry candy. Coarser + cooler tames it.', 'under_7', 'Comandante C40', 'Hario V60 02', 'conical', now() - interval '36 days'),
  ('c0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000001', 'espresso', 18, 42, null, 27, 92, 'fine', 4,
   'Fermenty but fun. 1:2.3, cooler temp.', '7_to_14', 'Niche Zero', 'Gaggia Classic Pro', 'conical', now() - interval '21 days'),
  ('c0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000003', 'pour_over', 12, null, 200, 150, 93, 'medium_fine', 5,
   '100g bag, tiny doses. Bergamot and white peach. Worth it.', 'under_7', 'Comandante C40', 'Origami dripper', 'conical', now() - interval '31 days'),
  ('c0000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000001', 'french_press', 30, null, 500, 270, 94, 'coarse', 3,
   'Earthy, heavy. Fine if you like Sumatra, and I mostly do.', '14_to_21', 'Baratza Encore', 'Bodum Chambord', 'conical', now() - interval '17 days'),
  ('c0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000005', 'batch', 60, null, 1000, 360, 93, 'medium', 4,
   'Office batch. 60g/L, tastes like chocolate-covered raisins.', '7_to_14', 'Fellow Ode Gen 2', 'Moccamaster KBGV', 'flat', now() - interval '16 days'),
  ('c0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000003', 'espresso', 18, 38, null, 29, 93, 'fine', 4,
   'Comfort espresso. Nutty, zero fuss to dial.', 'under_7', 'Eureka Mignon Specialita', 'Rancilio Silvia', 'flat', now() - interval '9 days'),
  ('c0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000002', 'cold_brew', 90, null, 1000, 43200, 22, 'extra_coarse', 4,
   '12h room temp, then fridge. Concentrate, cut 1:1.', 'over_21', 'Baratza Encore', 'Toddy', 'conical', now() - interval '11 days'),
  ('c0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000004', 'cold_brew', 100, null, 1200, 57600, 5, 'coarse', 5,
   '16h cold fridge steep. Smooth, no acid bite.', '14_to_21', 'Wilfa Svart', 'Mason jar + sieve', 'flat', now() - interval '6 days');
  -- El Paraiso Gesha intentionally has just 1 recipe; Huila Decaf has 0 (empty state).

-- ------------------------------------------------------------
-- Flags: 3 users flag the spam bag -> trigger sets flagged=true
-- ------------------------------------------------------------
insert into public.bag_flags (bag_id, user_id) values
  ('c0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000002'),
  ('c0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000003');

commit;
