# Bean Rater

Community brew recipes for specific bags of coffee. Look up a bag, see the
consensus recipe per brew method (once 3+ people have submitted), or log your
own — doses, temps, and times, not vibes.

**Stack:** Next.js 16 (App Router) · TypeScript · Supabase (Postgres + Auth,
magic-link) · Tailwind CSS 4 · shadcn/ui · React Hook Form · Zod

## Run locally

```bash
npm install
npm run dev
```

Requires `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://iqpbhmstlyordbdaawtk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from Supabase dashboard → Settings → API>
```

Open http://localhost:3000.

## Project layout

- `app/` — pages: search home, `bags/[id]` detail (method tabs + consensus),
  `bags/[id]/submit` recipe form, `admin` flagged-bag queue, `login` +
  `auth/confirm` magic-link flow. `proxy.ts` gates auth-only routes.
- `supabase/migrations/` — schema SQL applied to the remote project.
- `supabase/seed.sql` — demo data (already applied).
- `NOTES.md` — build decisions, deviations, launch checklist.
