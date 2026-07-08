import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { RatingDots } from "@/components/rating-dots"
import { BREW_METHOD_LABELS } from "@/lib/labels"
import { fmtNum, fmtTime } from "@/lib/format"
import { deleteRecipe } from "./actions"
import { DisplayNameForm } from "./display-name-form"

export const metadata = { title: "My recipes" }

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/dashboard")

  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, bag_id, brew_method, dose_g, brew_time_s, water_temp_c, rating, flagged, created_at, bags(coffee_name, brands(name))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const rows = recipes ?? []

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle()

  return (
    <div className="pt-8 space-y-8">
      <section className="space-y-2">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Display name
        </h2>
        <p className="text-xs text-muted-foreground">
          Shown publicly on your recipes.
        </p>
        <DisplayNameForm current={profile?.display_name ?? ""} />
      </section>

      <div className="space-y-4">
      <header className="flex items-baseline justify-between gap-2">
        <h1 className="text-lg font-semibold">My recipes</h1>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {rows.length} {rows.length === 1 ? "recipe" : "recipes"}
        </span>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed bg-card px-6 py-10 text-center space-y-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Nothing logged yet
          </p>
          <p className="text-sm text-muted-foreground">
            Find a bag you&apos;ve brewed and log your recipe —{" "}
            <Link href="/" className="text-primary underline underline-offset-2">
              start searching
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="divide-y rounded-md border bg-card">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <span className="flex items-center gap-2">
                  <Link
                    href={`/bags/${r.bag_id}`}
                    className="text-sm font-medium underline underline-offset-2"
                  >
                    {r.bags?.brands?.name} — {r.bags?.coffee_name}
                  </Link>
                  {r.flagged && (
                    <span className="font-mono text-[10px] uppercase tracking-wider text-destructive border border-destructive/40 rounded px-1.5 py-0.5">
                      Hidden
                    </span>
                  )}
                </span>
                <p className="text-xs text-muted-foreground font-mono">
                  {BREW_METHOD_LABELS[r.brew_method]} · {fmtNum(r.dose_g)}g ·{" "}
                  {fmtTime(r.brew_time_s)} · {fmtNum(r.water_temp_c)}°C
                </p>
                <RatingDots value={r.rating} showValue={false} className="mt-1" />
              </div>
              <form action={deleteRecipe} className="shrink-0">
                <input type="hidden" name="recipe_id" value={r.id} />
                <input type="hidden" name="bag_id" value={r.bag_id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="xs"
                  className="text-muted-foreground hover:text-destructive"
                >
                  Delete
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
      </div>
    </div>
  )
}
