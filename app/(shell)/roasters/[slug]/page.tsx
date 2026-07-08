import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { StatBlock } from "@/components/stat-block"
import { BagRow } from "@/components/bag-row"
import { Pager } from "@/components/pager"
import { ClaimForm } from "./claim-form"

const PAGE_SIZE = 15

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.rpc("browse_roasters", { p_slug: slug })
  const roaster = data?.[0]
  if (!roaster) return { title: "Roaster not found" }
  return {
    title: roaster.name,
    description:
      roaster.description ??
      `Community brew recipes for ${roaster.name} coffees — ${roaster.bag_count} bags, ${roaster.recipe_count} recipes.`,
  }
}

export default async function RoasterPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { slug } = await params
  const { page: rawPage } = await searchParams
  const page = Math.max(parseInt(rawPage ?? "1", 10) || 1, 1)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: roasters }, { data: bags }] = await Promise.all([
    supabase.rpc("browse_roasters", { p_slug: slug }),
    supabase.rpc("browse_bags", {
      p_brand_slug: slug,
      p_page: page,
      p_page_size: PAGE_SIZE,
    }),
  ])

  const roaster = roasters?.[0]
  if (!roaster) notFound()

  // Claim CTA state: only for signed-in regular users on unclaimed brands.
  let claimState: "hidden" | "cta" | "pending" | "login" = "hidden"
  if (!roaster.claimed) {
    if (!user) {
      claimState = "login"
    } else {
      const [{ data: profile }, { data: myClaim }] = await Promise.all([
        supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("brand_claims")
          .select("id")
          .eq("brand_id", roaster.brand_id)
          .eq("user_id", user.id)
          .eq("status", "pending")
          .maybeSingle(),
      ])
      if (myClaim) claimState = "pending"
      else if (profile?.role === "user") claimState = "cta"
    }
  }

  const rows = bags ?? []
  const totalCount = rows[0] ? Number(rows[0].total_count) : 0
  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1)

  return (
    <div className="pt-8 space-y-8">
      <header className="space-y-4">
        <div className="flex items-start gap-4">
          {roaster.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={roaster.logo_url}
              alt=""
              className="h-14 w-14 rounded-md border object-cover"
            />
          )}
          <div className="space-y-1 min-w-0">
            <h1 className="font-heading text-3xl tracking-tight flex items-center gap-3">
              {roaster.name}
              {roaster.claimed && (
                <span className="font-mono text-[10px] uppercase tracking-wider text-primary border border-primary/30 rounded px-1.5 py-0.5">
                  Claimed
                </span>
              )}
            </h1>
            {roaster.website && (
              <a
                href={roaster.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground underline underline-offset-2"
              >
                Website ↗
              </a>
            )}
          </div>
        </div>

        {roaster.description && (
          <p className="text-sm text-muted-foreground max-w-prose">
            {roaster.description}
          </p>
        )}

        <div className="grid grid-cols-3 gap-x-3 gap-y-3 rounded-md border bg-card p-4 max-w-md">
          <StatBlock label="Bags" value={String(roaster.bag_count)} />
          <StatBlock label="Recipes" value={String(roaster.recipe_count)} />
          <StatBlock
            label="Avg rating"
            value={
              roaster.avg_rating !== null
                ? Number(roaster.avg_rating).toFixed(1)
                : "—"
            }
          />
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Catalog
        </h2>
        {rows.length === 0 ? (
          <div className="rounded-md border border-dashed bg-card px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No bags yet —{" "}
              <Link href="/bags/new" className="text-primary underline underline-offset-2">
                add one
              </Link>
              .
            </p>
          </div>
        ) : (
          <ul className="divide-y rounded-md border bg-card">
            {rows.map((bag) => (
              <li key={bag.bag_id}>
                <BagRow bag={bag} />
              </li>
            ))}
          </ul>
        )}
        <Pager
          page={page}
          totalPages={totalPages}
          searchParams={{}}
          basePath={`/roasters/${slug}`}
        />
      </section>

      {claimState !== "hidden" && (
        <section className="border-t pt-6 space-y-2">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Work at {roaster.name}?
          </h2>
          {claimState === "cta" && (
            <ClaimForm
              brandId={roaster.brand_id}
              brandName={roaster.name}
              slug={slug}
            />
          )}
          {claimState === "pending" && (
            <p className="text-sm text-muted-foreground">
              Your claim is pending review. Once approved, this page unlocks
              in your account automatically.
            </p>
          )}
          {claimState === "login" && (
            <p className="text-sm text-muted-foreground">
              <Link
                href={`/login?next=${encodeURIComponent(`/roasters/${slug}`)}`}
                className="text-primary underline underline-offset-2"
              >
                Sign in
              </Link>{" "}
              to claim this roaster page and manage your catalog.
            </p>
          )}
        </section>
      )}
    </div>
  )
}
