import Link from "next/link"
import { RatingDots } from "@/components/rating-dots"
import { VerificationBadge } from "@/components/verification-badge"
import { PROCESS_LABELS, ROAST_LEVEL_LABELS } from "@/lib/labels"
import type { Database } from "@/lib/database.types"

type BrowseRow =
  Database["public"]["Functions"]["browse_bags"]["Returns"][number]

/** Directory row: identity on the left, rating + recipe count on the right. */
export function BagRow({ bag }: { bag: BrowseRow }) {
  const count = Number(bag.recipe_count)
  return (
    <Link
      href={`/bags/${bag.bag_id}`}
      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent"
    >
      <span className="min-w-0">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          {bag.brand_name}
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
      <span className="shrink-0 flex flex-col items-end gap-1">
        {bag.avg_rating !== null && (
          <RatingDots value={Number(bag.avg_rating)} />
        )}
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {count} {count === 1 ? "recipe" : "recipes"}
        </span>
      </span>
    </Link>
  )
}
