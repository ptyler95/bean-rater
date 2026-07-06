"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { NativeSelect } from "@/components/ui/native-select"
import { BREW_METHOD_LABELS, ROAST_LEVEL_LABELS } from "@/lib/labels"
import { Constants } from "@/lib/database.types"

export const SORT_LABELS: Record<string, string> = {
  newest: "Newest",
  top_rated: "Top rated",
  most_recipes: "Most recipes",
}

/**
 * URL-driven filter bar. Changing any control rewrites the query string and
 * resets to page 1; the server component re-renders the list.
 */
export function BagFilters({
  brands,
}: {
  brands: { name: string; slug: string }[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete("page") // any filter/sort change restarts at page 1
    const qs = params.toString()
    router.push(qs ? `/?${qs}` : "/", { scroll: false })
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <label className="space-y-1">
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Brand
        </span>
        <NativeSelect
          value={searchParams.get("brand") ?? ""}
          onChange={(e) => setParam("brand", e.target.value)}
          aria-label="Filter by brand"
        >
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b.slug} value={b.slug}>
              {b.name}
            </option>
          ))}
        </NativeSelect>
      </label>

      <label className="space-y-1">
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Brew method
        </span>
        <NativeSelect
          value={searchParams.get("method") ?? ""}
          onChange={(e) => setParam("method", e.target.value)}
          aria-label="Filter by brew method"
        >
          <option value="">All methods</option>
          {Constants.public.Enums.brew_method.map((m) => (
            <option key={m} value={m}>
              {BREW_METHOD_LABELS[m]}
            </option>
          ))}
        </NativeSelect>
      </label>

      <label className="space-y-1">
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Roast
        </span>
        <NativeSelect
          value={searchParams.get("roast") ?? ""}
          onChange={(e) => setParam("roast", e.target.value)}
          aria-label="Filter by roast level"
        >
          <option value="">All roasts</option>
          {Constants.public.Enums.roast_level.map((r) => (
            <option key={r} value={r}>
              {ROAST_LEVEL_LABELS[r]}
            </option>
          ))}
        </NativeSelect>
      </label>

      <label className="space-y-1">
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Sort
        </span>
        <NativeSelect
          value={searchParams.get("sort") ?? "newest"}
          onChange={(e) =>
            setParam("sort", e.target.value === "newest" ? "" : e.target.value)
          }
          aria-label="Sort bags"
        >
          {Object.entries(SORT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
      </label>
    </div>
  )
}
