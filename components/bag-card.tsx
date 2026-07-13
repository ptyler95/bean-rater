import Link from "next/link"
import { RatingDots } from "@/components/rating-dots"
import { VerificationBadge } from "@/components/verification-badge"
import { PROCESS_LABELS, ROAST_LEVEL_LABELS } from "@/lib/labels"
import type { Database } from "@/lib/database.types"

type BrowseRow =
  Database["public"]["Functions"]["browse_bags"]["Returns"][number]

/**
 * Roomy card treatment for a bag — used on roaster pages where the brand
 * is already known, so no brand eyebrow. Directory listings use BagRow.
 */
export function BagCard({ bag }: { bag: BrowseRow }) {
  const count = Number(bag.recipe_count)
  return (
    <Link
      href={`/bags/${bag.bag_id}`}
      className="flex h-full flex-col rounded-xl border bg-card p-5 transition-colors hover:bg-accent"
    >
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-heading text-2xl leading-tight">
          {bag.coffee_name}
        </span>
        <VerificationBadge status={bag.verification_status} />
      </span>
      <span className="mt-1 block text-xs text-muted-foreground">
        {bag.origin} · {ROAST_LEVEL_LABELS[bag.roast_level]} ·{" "}
        {PROCESS_LABELS[bag.process]}
      </span>
      <span className="mt-4 flex items-center gap-3 pt-1">
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
