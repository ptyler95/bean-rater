import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { VerificationBadge } from "@/components/verification-badge"
import { StatBlock } from "@/components/stat-block"
import { MethodTabs } from "./method-tabs"
import { FlagButton } from "./flag-button"
import { PROCESS_LABELS, ROAST_LEVEL_LABELS } from "@/lib/labels"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const [{ data: bag }, { count }] = await Promise.all([
    supabase
      .from("bags")
      .select("coffee_name, origin, roast_level, brands(name)")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("recipes")
      .select("*", { count: "exact", head: true })
      .eq("bag_id", id),
  ])
  if (!bag) return { title: "Bag not found" }
  const recipes = count ?? 0
  return {
    title: `${bag.coffee_name} — ${bag.brands?.name}`,
    description: `${recipes} community brew ${recipes === 1 ? "recipe" : "recipes"} for ${bag.brands?.name} ${bag.coffee_name} (${bag.origin}, ${ROAST_LEVEL_LABELS[bag.roast_level]} roast) — doses, temps, and times per brew method.`,
  }
}

export default async function BagPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: bag }, { data: consensus }, { data: recipes }, { data: profile }] =
    await Promise.all([
      supabase
        .from("bags")
        .select("*, brands(name, slug, website)")
        .eq("id", id)
        .maybeSingle(),
      supabase.rpc("bag_method_consensus", { p_bag_id: id }),
      supabase
        .from("recipes")
        .select("*, profiles(display_name)")
        .eq("bag_id", id)
        .order("created_at", { ascending: false }),
      user
        ? supabase
            .from("profiles")
            .select("role, brand_id")
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ])

  if (!bag) notFound()

  const canEdit =
    profile?.role === "admin" ||
    (profile?.role === "brand_admin" && profile.brand_id === bag.brand_id)

  return (
    <div className="pt-8 space-y-8">
      {bag.flagged && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          This bag is hidden from the public site pending review. You can see
          it because of your role or because you added it.
        </p>
      )}

      {/* Identity */}
      <header className="space-y-4">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            {bag.brands ? (
              <Link
                href={`/roasters/${bag.brands.slug}`}
                className="hover:text-foreground underline-offset-2 hover:underline"
              >
                {bag.brands.name}
              </Link>
            ) : null}
            <VerificationBadge status={bag.verification_status} />
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {bag.coffee_name}
          </h1>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-x-3 gap-y-3 rounded-md border bg-card p-4">
          <StatBlock label="Origin" value={bag.origin} />
          <StatBlock label="Region" value={bag.region ?? "—"} />
          <StatBlock label="Roast" value={ROAST_LEVEL_LABELS[bag.roast_level]} />
          <StatBlock label="Process" value={PROCESS_LABELS[bag.process]} />
          <StatBlock
            label="Altitude"
            value={bag.altitude_masl ? String(bag.altitude_masl) : "—"}
            unit="masl"
          />
          <StatBlock label="Varietal" value={bag.varietal ?? "—"} />
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button nativeButton={false} render={<Link href={`/bags/${bag.id}/submit`} />}>
            Submit your recipe
          </Button>
          <span className="flex items-center gap-3">
            {canEdit && (
              <Link
                href={`/bags/${bag.id}/edit`}
                className="text-xs text-muted-foreground underline underline-offset-2"
              >
                Edit bag
              </Link>
            )}
            {bag.product_url && (
              <a
                href={bag.product_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground underline underline-offset-2"
              >
                Roaster page ↗
              </a>
            )}
          </span>
        </div>
      </header>

      {/* Recipes by method */}
      <MethodTabs
        bagId={bag.id}
        recipes={recipes ?? []}
        consensus={consensus ?? []}
        viewerId={user?.id ?? null}
      />

      <div className="border-t pt-4">
        <FlagButton bagId={bag.id} />
      </div>
    </div>
  )
}
