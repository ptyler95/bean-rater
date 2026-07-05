import { StatBlock } from "@/components/stat-block"
import { RatingDots } from "@/components/rating-dots"
import { fmtNum, fmtTime } from "@/lib/format"
import { FRESHNESS_LABELS, GRIND_LABELS } from "@/lib/labels"
import type { Tables } from "@/lib/database.types"

export type RecipeWithAuthor = Tables<"recipes"> & {
  profiles: { display_name: string | null } | null
}

export function RecipeCard({ recipe }: { recipe: RecipeWithAuthor }) {
  const gear = [recipe.grinder_model, recipe.machine_model, recipe.burr_type]
    .filter(Boolean)
    .join(" · ")

  return (
    <article className="rounded-md border bg-card p-4 space-y-3">
      <header className="flex items-center justify-between gap-2">
        <RatingDots value={recipe.rating} />
        <div className="text-xs text-muted-foreground truncate">
          {recipe.profiles?.display_name ?? "Anonymous"}
          <span className="mx-1.5 text-border">|</span>
          <time className="font-mono">
            {new Date(recipe.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </time>
        </div>
      </header>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-x-3 gap-y-2 border-y py-3">
        <StatBlock label="Dose" value={fmtNum(recipe.dose_g)} unit="g" />
        <StatBlock label="Yield" value={fmtNum(recipe.yield_g)} unit="g" />
        <StatBlock label="Water" value={fmtNum(recipe.water_ml)} unit="ml" />
        <StatBlock label="Time" value={fmtTime(recipe.brew_time_s)} />
        <StatBlock label="Temp" value={fmtNum(recipe.water_temp_c)} unit="°C" />
        <StatBlock label="Grind" value={GRIND_LABELS[recipe.grind_category]} />
      </div>

      {(gear || recipe.freshness_offset) && (
        <div className="text-xs text-muted-foreground space-x-2">
          {gear && <span>{gear}</span>}
          {recipe.freshness_offset && (
            <span className="font-mono">
              {FRESHNESS_LABELS[recipe.freshness_offset]}
            </span>
          )}
        </div>
      )}

      {recipe.notes && <p className="text-sm leading-relaxed">{recipe.notes}</p>}
    </article>
  )
}
