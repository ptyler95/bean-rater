"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { ROAST_LEVEL_LABELS } from "@/lib/labels"
import type { Database } from "@/lib/database.types"

type SearchRow =
  Database["public"]["Functions"]["search_bags"]["Returns"][number]

export function BagSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchRow[]>([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const requestSeq = useRef(0)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    setSearching(true)
    const seq = ++requestSeq.current
    const timer = setTimeout(async () => {
      const supabase = createClient()
      const { data } = await supabase.rpc("search_bags", { q })
      if (seq !== requestSeq.current) return // stale response
      setResults(data ?? [])
      setOpen(true)
      setSearching(false)
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        placeholder="Search brand or coffee — e.g. “Meridian Nyeri”"
        className="h-12 text-base"
        aria-label="Search coffee bags"
      />

      {open && (
        <div className="absolute z-30 top-full mt-1 inset-x-0 rounded-md border bg-popover shadow-md overflow-hidden">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              {searching ? "Searching…" : "No bags match. Try fewer words?"}
            </p>
          ) : (
            <ul>
              {results.map((r) => (
                <li key={r.bag_id} className="border-b last:border-b-0">
                  <Link
                    href={`/bags/${r.bag_id}`}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-accent"
                    onClick={() => setOpen(false)}
                  >
                    <span className="min-w-0">
                      <span className="block text-[11px] uppercase tracking-wider text-muted-foreground truncate">
                        {r.brand_name}
                      </span>
                      <span className="block text-sm font-medium truncate">
                        {r.coffee_name}
                      </span>
                      <span className="block text-xs text-muted-foreground truncate">
                        {r.origin} · {ROAST_LEVEL_LABELS[r.roast_level]}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                      {r.recipe_count}{" "}
                      {Number(r.recipe_count) === 1 ? "recipe" : "recipes"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
