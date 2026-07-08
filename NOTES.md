# Grounded (formerly Bean Rater) — build notes

Decisions made autonomously during the build, deviations from the spec and why,
and what's left for a real launch.

## Environment findings (differed from the brief)

- The brief said the Supabase project was empty and to scaffold Next.js 14.
  In reality, `~/Desktop/bean-rater` already contained a **Next.js 16.2.9**
  project (React 19, Tailwind v4) from a June 16 session, and the database
  already had `brands/bags/recipes/profiles` tables (0 rows) with two applied
  migrations. Per your call ("Keep & migrate"), I kept the Next 16 project and
  migrated the schema in place to match the FINAL spec instead of downgrading
  to Next 14 or wiping.
- Two leftover test rows from June (brand "Oynx", bag "Dark") were deleted —
  clearly scratch data that would have polluted search.
- Next 16 renamed `middleware.ts` to `proxy.ts`; the session-refresh/auth-gate
  logic lives there now.

## Schema decisions

- All spec fields implemented exactly. In addition, the pre-existing schema had
  a few extras that I **kept** because they're useful and harmless:
  - `profiles.role` (`user`/`admin`) — used to gate `/admin` and admin RLS.
  - `updated_at` columns + trigger on all tables.
  - A unique constraint `(bag_id, user_id, brew_method)` on recipes — one
    recipe per user per bag per method. Not in the spec, but it protects the
    consensus from one user stacking submissions, so I kept it and the form
    shows a friendly error on violation.
- Dropped `recipes.vote_count` (pre-existing, not in the FINAL spec).
- `bags.added_by` is NOT NULL (spec doesn't mark it nullable). Deleting an
  auth user who added bags will be blocked by the FK — acceptable for now.
- **`bag_flags` table added** (not in the spec's model, but the business rules
  require per-user flag inserts). One flag per user per bag (PK), and an
  `AFTER INSERT` trigger increments `bags.flag_count` and sets `flagged=true`
  at 3. The old `flag_bag()` function (which flagged on the *first* report)
  was removed.
- Added FK `recipes.user_id -> profiles.user_id` alongside the spec's
  `auth.users` FK, purely so PostgREST can embed the author's display name.
- `profiles.recipe_count` is maintained by an insert/delete trigger on recipes.
- Consensus = `bag_method_consensus(bag_id)` RPC: request-time averages
  (dose/yield/water/time/temp), `mode()` for grind, avg rating, per method.
- Search = `search_bags(q)` RPC: pg_trgm similarity (threshold 0.15) + ILIKE,
  flagged bags excluded, limit 12.
- RLS: public read of non-flagged bags (admins and the bag's own submitter see
  flagged ones); recipes publicly readable; authenticated-only inserts for
  recipes/flags; own-row edit/delete on recipes; **no** public writes to
  brands; bag inserts force `verification_status='unverified'`.
- Migrations were applied through the Supabase MCP (`apply_migration`, tracked
  in the remote migration history) because the Supabase CLI isn't installed on
  this machine. The same SQL is mirrored in `supabase/migrations/` in this
  repo. Note: the two June migrations predate the repo and exist only remotely.

## App decisions

- Magic-link auth only (Google OAuth skipped per spec). `/auth/confirm`
  handles both the default Supabase email template (`?code=`) and the
  `{{ .TokenHash }}` template (`?token_hash=&type=`), so it works without
  dashboard template changes.
- The old June WIP (password login/signup, dashboard, add-bag form) was
  removed: it conflicted with magic-link auth and the brand-write lockdown,
  and no add-bag UI is in scope.
- shadcn/ui's current CLI installs the Base UI flavor (not Radix) — kept close
  to stock. The recipe form uses styled native `<select>`s (better with
  react-hook-form and on mobile).
- Seed data: 5 demo users (unroutable `@beanrater.local` emails, random
  passwords), 4 brands, 13 bags, 30 recipes. Five bag/method combos are at or
  above the 3-recipe consensus threshold; one bag has zero recipes (empty
  state); one spam bag is flagged by 3 users (admin queue demo).
  `supabase/seed.sql` mirrors what was applied.
- `demo.mara@beanrater.local` has `role='admin'` so the admin RLS paths are
  exercised. Her password is randomized; nobody can log in as her.
- Design: Inter (UI) + JetBrains Mono (numerics), warm off-white
  `oklch(0.973 0.006 78)`, near-black ink, one muted rust accent
  `oklch(0.52 0.115 42)`, label-over-value stat blocks, 5-dot rating scale.

## Add-bag flow (added 2026-07-06, post-launch)

- `/bags/new` (auth-gated): single-column grouped form — roaster → coffee
  identity → optional details. Entry points under the home search and in the
  search dropdown's no-results state.
- Brands: the spec's "no public write access to Brand" is preserved at the
  table level; the only write path is a `find_or_create_brand(name)`
  SECURITY DEFINER RPC (authenticated-only) that sets name + server-side slug
  and nothing else. The atomic `on conflict` upsert also fixes the
  brand-creation race condition noted in the old June README.
- Brand field autocompletes against existing brands so spellings converge;
  free text creates a new brand.

## Homepage v2 (added 2026-07-06, post-launch)

- Directory replaces the flat "recently added" list: 15 bags/page with a
  prev/next pager, filters for brand / brew method / roast level, and a sort
  control (newest / top rated / most recipes). All state lives in the URL.
- Backed by a `browse_bags` RPC that filters, sorts, and paginates in one
  query and repeats the total filtered count per row for the pager. When a
  brew-method filter is active, each bag's recipe count and average rating
  are scoped to that method, and bags with no recipes for it drop out.
- "Top rated" is a sort rather than a filter so unrated new bags stay
  discoverable (filtering them out would fight the crowdsourcing loop).
- Rows now show the average-rating dot scale and recipe count.

## Moderation version (added 2026-07-06, post-launch)

- **Admin panel** (`/admin`, full admins): all bags sorted by flag reports,
  view filters (all / hidden / reported), and per-bag actions — Edit,
  Hide/Republish (republish resets the counter and clears old reports so one
  new flag can't instantly re-hide), verification setter, Delete (behind a
  confirm reveal). Auto-hide at 3 flags is unchanged.
- **Brand admins**: `role='brand_admin'` + `profiles.brand_id`. They see only
  their brand's catalog in `/admin` (including hidden bags), can add and edit
  those bags, and their additions/edits can carry `roaster_verified` — but a
  DB trigger blocks them (and everyone but full admins) from touching
  `flagged`/`flag_count`, so a roaster can't unhide their own flagged listing.
  Assignment is by email + brand in the admin panel (`assign_brand_admin`
  RPC); demo.otto@beanrater.local is Meridian's brand admin as a live example.
- **Archive user**: deleting an auth user now cascades their profile away but
  reassigns their bags/recipes to the sentinel "Archive" user
  (`archive@beanrater.local`) via `ON DELETE SET DEFAULT` — community data
  survives account deletion, and admins can edit/delete archived recipes.
- **User dashboard** (`/dashboard`): your submitted recipes with spec
  summaries and delete. Recipe *editing* is still deferred.
- **Legal**: `/privacy` and `/terms` drafted and linked in the footer. These
  are sensible drafts, not legal advice — have a professional review them
  before serious scale.
- **Security items from the brief**: `product_url` now restricted to
  http(s) in Zod *and* by DB check constraints (also `brands.website`);
  baseline security headers (nosniff, frame-deny, referrer policy,
  permissions policy) added in `next.config.ts`.
- **Renamed `v60` → `pour_over`** across enum, data, and labels; the specific
  brewer (V60, Origami, Kalita…) belongs in the recipe's brewer field.
- Note for SQL maintenance: end-user API updates to `flagged`/`flag_count`
  are reverted by the guard trigger unless the caller is an admin; SQL-editor
  and service contexts (no `auth.uid()`) bypass the guard.

## Marketing homepage + "fresh crop" restyle (added 2026-07-07, post-launch)

- The bag directory moved from `/` to `/bags`; `/` is now a marketing/community
  homepage (mission pitch, live stats, 5 newest recipes, most-reviewed bag,
  CTA to `/bags`). `BagFilters` and `Pager` write `/bags?…` URLs now.
- Content routes live in the `app/(shell)/` route group, which applies the
  shared `max-w-4xl` container; the homepage lays out its own full-width
  sections. `app/auth` stayed outside the group (no UI, and `@/app/auth/actions`
  is imported elsewhere).
- Restyle modeled on the Figma Sites "Modern Product Launch" template the user
  picked (green = green coffee bean / freshness): pale-sage background, deep
  olive `--primary`, sage `--secondary`/`--accent`, Instrument Serif as
  `--font-heading` for display headings (400-only — `.font-heading` pins
  `font-weight: 400`), pill buttons (`rounded-full` in `ui/button.tsx`),
  `--radius` 0.375 → 0.625rem, wider header/footer (`max-w-6xl`).
- Homepage stats are live counts (recipes/bags/brands, RLS-filtered); the
  featured bag reuses `browse_bags` with `most_recipes`/page-size 1. No new
  migrations.

## Launch-week pass (2026-07-07): security review, roaster pages, claims, SEO

- **Security review fixes** (`20260707150000_security_hardening_2.sql` + fix):
  - Profiles own-update policy now locks `brand_id` as well as `role` — a
    brand admin could previously reassign themselves to any brand.
  - The moderation guard trigger also reverts `verification_status →
    community_verified` and `added_by` changes by non-admins (brand admins
    could self-grant the community badge / spoof attribution).
  - `/auth/confirm` sanitizes `next` (same-site paths only — was an open
    redirect); `sendMagicLink` no longer throws on a missing Origin header.
  - Users can rename their public display name from `/dashboard` (the signup
    default is the email local-part, which is publicly visible on recipes).
  - HSTS header added. Advisor WARNs on `is_admin`/`is_brand_admin_for`
    anon-execute remain intentional (RLS policies evaluate them as the
    querying role); all SECURITY DEFINER RPCs re-audited — each gates
    internally. All fixes verified with impersonation probes run in
    rolled-back transactions.
- **Roaster pages**: `/roasters` index + `/roasters/[slug]` (stats, catalog
  via `browse_bags`, claim CTA), backed by `browse_roasters(p_slug)` RPC;
  `brands.description` added; bag detail brand name and header/footer nav
  link to roaster pages; `Pager` gained a `basePath` prop.
- **Claim flow**: `brand_claims` table + `request/list/resolve_brand_claim`
  and `update_brand_profile` RPCs (all SECURITY DEFINER, internally gated,
  writes via RPC only). Claim form on the roaster page; approve/reject queue
  and brand-profile editor in `/admin`; brand admins see "My roaster" in the
  header and a "View public page" link. Approval is manual; claimants are
  capped at 3 pending claims, one per brand.
- **RPC arg convention**: optional/nullable RPC args now have SQL `default
  null` so the generated TS types mark them optional — omit rather than pass
  null (`assign_brand_admin` demotes when the slug is omitted).
- **SEO**: `lib/site.ts` centralizes SITE_NAME (rename = one constant +
  copy), `metadataBase` + OG/twitter defaults, per-bag and per-roaster
  `generateMetadata`, dynamic OG images (`opengraph-image.tsx` for home,
  bags, roasters), `app/sitemap.ts`, `app/robots.ts`.
- **Deploy prep**: `(shell)/error.tsx` + root `not-found.tsx`, Vercel
  Analytics in the root layout, `.env.example`. Duplicate "Metric Coffee"
  brand merged (5 bags under `metric-coffee`).
- Set `NEXT_PUBLIC_SITE_URL` in Vercel once the domain exists (sitemap/OG
  URLs fall back to `VERCEL_URL`).

## Rebrand (2026-07-07)

- Renamed Bean Rater → **Grounded**, production domain **groundbeans.com**
  (hardcoded fallback in `lib/site.ts` for Vercel production; override with
  `NEXT_PUBLIC_SITE_URL`). Legal-page contact is preston@namelessconsulting.com.
- The `@beanrater.local` sentinel/archive email domain is unchanged —
  unroutable and invisible to users; not worth a data migration.

## To make yourself admin

After you first sign in (magic link), run in the Supabase SQL editor:

```sql
update public.profiles set role = 'admin'
where user_id = (select id from auth.users where email = 'ptyler95@gmail.com');
```

## What's left for a real launch (out of scope per brief)

- Roaster claim flow (`brands.claimed/claimed_by` exist but nothing sets them).
- Community/roaster verification workflows (`verification_status` is set only
  by hand today).
- Admin actions (unflag, delete, verify) — the queue is read-only.
- Recipe edit/delete UI (RLS already allows it; no interface yet).
- Pagination (home list and recipes are unpaginated), rate limiting, abuse
  controls beyond the flag threshold.
- Custom SMTP + branded auth emails (default Supabase sender has low limits).
- Bag photo upload (schema has `photo_url`; no storage bucket wired).
- SEO/OG metadata beyond basics, analytics, error monitoring.
