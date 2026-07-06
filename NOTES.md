# Bean Rater — build notes

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
