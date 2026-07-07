import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { RatingDots } from "@/components/rating-dots"
import { VerificationBadge } from "@/components/verification-badge"
import { BREW_METHOD_LABELS, ROAST_LEVEL_LABELS } from "@/lib/labels"

function timeAgo(iso: string) {
  const seconds = Math.max((Date.now() - new Date(iso).getTime()) / 1000, 0)
  if (seconds < 3600) return `${Math.max(Math.floor(seconds / 60), 1)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 86400 * 30) return `${Math.floor(seconds / 86400)}d ago`
  return `${Math.floor(seconds / (86400 * 30))}mo ago`
}

function formatBrewTime(s: number) {
  if (s >= 3600) return `${Math.round(s / 3600)}h`
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, "0")}`
}

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Find your exact bag",
    body: "Search by roaster or coffee name. Recipes here are tied to specific bags — not generic methods — so the starting point actually fits what's in your hopper.",
  },
  {
    step: "02",
    title: "Brew a proven recipe",
    body: "Skip the wasted doses. Start from a dose, temp, grind, and time that someone has already dialed in for those exact beans, and adjust from there.",
  },
  {
    step: "03",
    title: "Share your dial-in",
    body: "Log what worked (or didn't) and rate the result. Every recipe you add saves the next person a morning of trial and error.",
  },
]

export default async function HomePage() {
  const supabase = await createClient()
  const [
    { count: recipeCount },
    { count: bagCount },
    { count: brandCount },
    { data: recentRecipes },
    { data: featuredRows },
  ] = await Promise.all([
    supabase.from("recipes").select("*", { count: "exact", head: true }),
    supabase.from("bags").select("*", { count: "exact", head: true }),
    supabase.from("brands").select("*", { count: "exact", head: true }),
    supabase
      .from("recipes")
      .select(
        "id, brew_method, rating, dose_g, water_temp_c, brew_time_s, created_at, bag:bags!inner(id, coffee_name, brand:brands(name))"
      )
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.rpc("browse_bags", {
      p_brand_slug: null,
      p_brew_method: null,
      p_roast_level: null,
      p_sort: "most_recipes",
      p_page: 1,
      p_page_size: 1,
    }),
  ])

  const featured = featuredRows?.[0] ?? null
  const stats = [
    { value: recipeCount ?? 0, label: "brew recipes shared" },
    { value: bagCount ?? 0, label: "bags cataloged" },
    { value: brandCount ?? 0, label: "roasters represented" },
  ]

  return (
    <div className="pb-24">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-5 pt-20 pb-16 text-center sm:pt-28">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Community brew data
        </p>
        <h1 className="mt-5 font-heading text-5xl leading-[1.05] tracking-tight sm:text-7xl">
          Dial in less.
          <br />
          Enjoy your beans more.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Bean Rater is the community home for brew recipes tied to specific
          bags of coffee. Whether you just picked up a new bag or you&apos;re
          hunting for the next one, start from doses, temps, and times that
          other people have already worked out — and spend your mornings
          drinking coffee, not troubleshooting it.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Button nativeButton={false} render={<Link href="/bags" />} size="lg">
            Browse bags &amp; recipes →
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/bags/new" />}
            variant="secondary"
            size="lg"
          >
            Add your bag
          </Button>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {stats.map((s) => (
            <div key={s.label} className="px-5 py-10 text-center">
              <div className="font-heading text-5xl tabular-nums sm:text-6xl">
                {s.value.toLocaleString()}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-5 pt-20 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          How it works
        </p>
        <h2 className="mt-3 font-heading text-3xl tracking-tight sm:text-4xl">
          Built for anyone trying a new bag.
        </h2>
        <div className="mt-10 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} className="border-t pt-6">
              <div className="font-heading text-4xl text-muted-foreground/60">
                {item.step}
              </div>
              <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Fresh from the community + featured bag */}
      <section className="mx-auto max-w-6xl px-5 pt-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_minmax(20rem,24rem)] lg:gap-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Fresh from the community
            </p>
            <h2 className="mt-3 font-heading text-3xl tracking-tight sm:text-4xl">
              Recently added recipes
            </h2>
            {recentRecipes && recentRecipes.length > 0 ? (
              <ul className="mt-8 divide-y rounded-xl border bg-card">
                {recentRecipes.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/bags/${r.bag.id}`}
                      className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-accent"
                    >
                      <span className="min-w-0">
                        <span className="block text-[11px] uppercase tracking-wider text-muted-foreground">
                          {r.bag.brand.name} ·{" "}
                          {BREW_METHOD_LABELS[r.brew_method]}
                        </span>
                        <span className="block truncate text-sm font-medium">
                          {r.bag.coffee_name}
                        </span>
                        <span className="block font-mono text-xs tabular-nums text-muted-foreground">
                          {r.dose_g}g · {r.water_temp_c}°C ·{" "}
                          {formatBrewTime(r.brew_time_s)}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <RatingDots value={r.rating} showValue={false} />
                        <span className="font-mono text-xs text-muted-foreground">
                          {timeAgo(r.created_at)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-8 text-sm text-muted-foreground">
                No recipes yet — be the first to{" "}
                <Link href="/bags" className="text-primary underline underline-offset-2">
                  add one
                </Link>
                .
              </p>
            )}
          </div>

          {featured && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Most reviewed
              </p>
              <h2 className="mt-3 font-heading text-3xl tracking-tight sm:text-4xl">
                Community favorite
              </h2>
              <Link
                href={`/bags/${featured.bag_id}`}
                className="mt-8 block rounded-2xl bg-secondary p-8 transition-colors hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_4%)]"
              >
                <span className="text-[11px] uppercase tracking-wider text-secondary-foreground/80 flex items-center gap-2">
                  {featured.brand_name}
                  <VerificationBadge status={featured.verification_status} />
                </span>
                <span className="mt-2 block font-heading text-3xl leading-tight text-secondary-foreground">
                  {featured.coffee_name}
                </span>
                <span className="mt-1 block text-sm text-secondary-foreground/80">
                  {featured.origin} · {ROAST_LEVEL_LABELS[featured.roast_level]}
                </span>
                <span className="mt-5 flex items-center gap-3">
                  {featured.avg_rating !== null && (
                    <RatingDots value={Number(featured.avg_rating)} />
                  )}
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {Number(featured.recipe_count)}{" "}
                    {Number(featured.recipe_count) === 1
                      ? "recipe"
                      : "recipes"}
                  </span>
                </span>
                <span className="mt-6 inline-block text-sm font-medium text-primary">
                  See the recipes →
                </span>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-6xl px-5 pt-24">
        <div className="rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground sm:py-20">
          <h2 className="font-heading text-4xl leading-tight tracking-tight sm:text-5xl">
            Your next bag is already dialed in.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-primary-foreground/80 sm:text-base">
            Search the catalog, steal a recipe, and get straight to the good
            cup. Then leave your own notes for the next person.
          </p>
          <div className="mt-8">
            <Button
              nativeButton={false}
              render={<Link href="/bags" />}
              size="lg"
              className="bg-background text-foreground hover:bg-background/90"
            >
              Browse bags &amp; recipes →
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
