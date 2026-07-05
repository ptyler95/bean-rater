import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { BagSearch } from "@/components/bag-search"
import { VerificationBadge } from "@/components/verification-badge"
import { PROCESS_LABELS, ROAST_LEVEL_LABELS } from "@/lib/labels"

export default async function HomePage() {
  const supabase = await createClient()
  const { data: recentBags } = await supabase
    .from("bags")
    .select("id, coffee_name, origin, roast_level, process, verification_status, brands(name), recipes(count)")
    .order("created_at", { ascending: false })
    .limit(10)

  return (
    <div className="pt-10 space-y-10">
      <section className="space-y-3">
        <h1 className="text-lg font-semibold tracking-tight">
          Find brew recipes for your exact bag.
        </h1>
        <BagSearch />
        <p className="text-xs text-muted-foreground">
          Community-submitted doses, temps, and times per bag and brew method.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Recently added bags
        </h2>
        <ul className="divide-y rounded-md border bg-card">
          {(recentBags ?? []).map((bag) => {
            const recipeCount = bag.recipes?.[0]?.count ?? 0
            return (
              <li key={bag.id}>
                <Link
                  href={`/bags/${bag.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent"
                >
                  <span className="min-w-0">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      {bag.brands?.name}
                      <VerificationBadge status={bag.verification_status} />
                    </span>
                    <span className="block text-sm font-medium truncate">
                      {bag.coffee_name}
                    </span>
                    <span className="block text-xs text-muted-foreground truncate">
                      {bag.origin} · {ROAST_LEVEL_LABELS[bag.roast_level]} ·{" "}
                      {PROCESS_LABELS[bag.process]}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                    {recipeCount} {recipeCount === 1 ? "recipe" : "recipes"}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
