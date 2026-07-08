import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

export const metadata = { title: "Roasters" }

export default async function RoastersPage() {
  const supabase = await createClient()
  const { data: roasters } = await supabase.rpc("browse_roasters")
  const rows = roasters ?? []

  return (
    <div className="pt-10 space-y-8">
      <section className="space-y-3">
        <h1 className="font-heading text-3xl sm:text-4xl tracking-tight">
          Roasters
        </h1>
        <p className="text-xs text-muted-foreground">
          Every roaster with bags in the directory. Work at one of them?{" "}
          Claim your page from the roaster&apos;s profile.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            All roasters
          </h2>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {rows.length} {rows.length === 1 ? "roaster" : "roasters"}
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-md border border-dashed bg-card px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No roasters yet —{" "}
              <Link href="/bags/new" className="text-primary underline underline-offset-2">
                add the first bag
              </Link>
              .
            </p>
          </div>
        ) : (
          <ul className="divide-y rounded-md border bg-card">
            {rows.map((r) => {
              const bags = Number(r.bag_count)
              const recipes = Number(r.recipe_count)
              return (
                <li key={r.slug}>
                  <Link
                    href={`/roasters/${r.slug}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent"
                  >
                    <span className="min-w-0">
                      <span className="text-sm font-medium flex items-center gap-2">
                        {r.name}
                        {r.claimed && (
                          <span className="font-mono text-[10px] uppercase tracking-wider text-primary border border-primary/30 rounded px-1.5 py-0.5">
                            Claimed
                          </span>
                        )}
                      </span>
                      {r.description && (
                        <span className="block text-xs text-muted-foreground truncate max-w-md">
                          {r.description}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                      {bags} {bags === 1 ? "bag" : "bags"} · {recipes}{" "}
                      {recipes === 1 ? "recipe" : "recipes"}
                      {r.avg_rating !== null && <> · {Number(r.avg_rating).toFixed(1)} avg</>}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
