import Link from "next/link"
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { BagSearch } from "@/components/bag-search"
import { BagFilters } from "@/components/bag-filters"
import { BagRow } from "@/components/bag-row"
import { Pager } from "@/components/pager"
import { JsonLd } from "@/components/json-ld"
import { itemListSchema } from "@/lib/schema"
import { Constants, type Enums } from "@/lib/database.types"

const PAGE_SIZE = 15

function asEnum<T extends readonly string[]>(
  values: T,
  v: string | undefined
): T[number] | null {
  return v && (values as readonly string[]).includes(v) ? (v as T[number]) : null
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{
    brand?: string
    method?: string
    roast?: string
    sort?: string
    page?: string
  }>
}): Promise<Metadata> {
  const params = await searchParams
  const page = Math.max(parseInt(params.page ?? "1", 10) || 1, 1)
  const filtered = !!(params.brand || params.method || params.roast || params.sort)
  return {
    title: "Browse bags",
    description:
      "Browse coffee bags with community brew recipes: filter by roaster, roast level, and brew method.",
    alternates: { canonical: page > 1 && !filtered ? `/bags?page=${page}` : "/bags" },
    // Filtered and sorted views duplicate the main list; keep them out of the index.
    robots: filtered ? { index: false, follow: true } : undefined,
  }
}

export default async function BrowseBagsPage({
  searchParams,
}: {
  searchParams: Promise<{
    brand?: string
    method?: string
    roast?: string
    sort?: string
    page?: string
  }>
}) {
  const params = await searchParams
  const method = asEnum(Constants.public.Enums.brew_method, params.method)
  const roast = asEnum(Constants.public.Enums.roast_level, params.roast)
  const sort = ["top_rated", "most_recipes"].includes(params.sort ?? "")
    ? (params.sort as string)
    : "newest"
  const page = Math.max(parseInt(params.page ?? "1", 10) || 1, 1)

  const supabase = await createClient()
  const [{ data: bags }, { data: brands }] = await Promise.all([
    supabase.rpc("browse_bags", {
      p_brand_slug: params.brand || undefined,
      p_brew_method: (method ?? undefined) as Enums<"brew_method"> | undefined,
      p_roast_level: (roast ?? undefined) as Enums<"roast_level"> | undefined,
      p_sort: sort,
      p_page: page,
      p_page_size: PAGE_SIZE,
    }),
    supabase.from("brands").select("name, slug").order("name"),
  ])

  const rows = bags ?? []
  const totalCount = rows[0] ? Number(rows[0].total_count) : 0
  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1)
  const hasFilters = !!(params.brand || method || roast)

  return (
    <div className="pt-10 space-y-8">
      <JsonLd
        data={itemListSchema(
          "Coffee bags with community brew recipes",
          rows.map((b) => ({
            name: `${b.brand_name} ${b.coffee_name}`,
            path: `/bags/${b.bag_id}`,
          }))
        )}
      />
      <section className="space-y-3">
        <h1 className="font-heading text-3xl sm:text-4xl tracking-tight">
          Find brew recipes for your exact bag.
        </h1>
        <BagSearch />
        <p className="text-xs text-muted-foreground">
          Community-submitted doses, temps, and times per bag and brew method.
          Can&apos;t find yours?{" "}
          <Link
            href="/bags/new"
            className="text-primary underline underline-offset-2"
          >
            Add a bag
          </Link>
          .
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Browse bags
          </h2>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {totalCount} {totalCount === 1 ? "bag" : "bags"}
          </span>
        </div>

        <BagFilters brands={brands ?? []} />

        {rows.length === 0 ? (
          <div className="rounded-md border border-dashed bg-card px-6 py-10 text-center space-y-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              No bags match
            </p>
            <p className="text-sm text-muted-foreground">
              {hasFilters ? (
                <>
                  Try loosening a filter — or{" "}
                  <Link
                    href="/bags/new"
                    className="text-primary underline underline-offset-2"
                  >
                    add the bag
                  </Link>{" "}
                  you&apos;re looking for.
                </>
              ) : page > 1 ? (
                <Link
                  href="/bags"
                  className="text-primary underline underline-offset-2"
                >
                  Back to page 1
                </Link>
              ) : (
                "Nothing here yet."
              )}
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
          searchParams={{
            brand: params.brand,
            method: params.method,
            roast: params.roast,
            sort: params.sort,
          }}
        />
      </section>
    </div>
  )
}
