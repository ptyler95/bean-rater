import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

/** Prev/next pager that preserves the current filter query string. */
export function Pager({
  page,
  totalPages,
  searchParams,
  basePath = "/bags",
}: {
  page: number
  totalPages: number
  searchParams: Record<string, string | undefined>
  basePath?: string
}) {
  if (totalPages <= 1) return null

  function hrefFor(target: number) {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(searchParams)) {
      if (v && k !== "page") params.set(k, v)
    }
    if (target > 1) params.set("page", String(target))
    const qs = params.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }

  const linkClass = buttonVariants({ variant: "outline", size: "sm" })
  const disabledClass = "pointer-events-none opacity-40"

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3"
    >
      <Link
        href={hrefFor(page - 1)}
        aria-disabled={page <= 1}
        className={cn(linkClass, page <= 1 && disabledClass)}
      >
        ← Prev
      </Link>
      <span className="font-mono text-xs tabular-nums text-muted-foreground">
        page {page} / {totalPages}
      </span>
      <Link
        href={hrefFor(page + 1)}
        aria-disabled={page >= totalPages}
        className={cn(linkClass, page >= totalPages && disabledClass)}
      >
        Next →
      </Link>
    </nav>
  )
}
