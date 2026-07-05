import { StatBlock } from "@/components/stat-block"
import { RatingDots } from "@/components/rating-dots"
import { fmtNum, fmtTime } from "@/lib/format"
import { GRIND_LABELS } from "@/lib/labels"
import type { Database } from "@/lib/database.types"

export type ConsensusRow =
  Database["public"]["Functions"]["bag_method_consensus"]["Returns"][number]

/**
 * Aggregated "Community Recipe" for a bag/brew-method combo.
 * Only rendered once the combo has >= 3 submissions.
 */
export function ConsensusCard({ consensus }: { consensus: ConsensusRow }) {
  return (
    <section className="rounded-md border-2 border-primary/60 bg-card p-4 space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          Community Recipe
        </h3>
        <span className="font-mono text-[11px] text-muted-foreground">
          n = {consensus.recipe_count} submissions
        </span>
      </header>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-x-3 gap-y-2 border-y py-3">
        <StatBlock label="Dose" value={fmtNum(consensus.avg_dose_g)} unit="g" />
        <StatBlock label="Yield" value={fmtNum(consensus.avg_yield_g)} unit="g" />
        <StatBlock label="Water" value={fmtNum(consensus.avg_water_ml)} unit="ml" />
        <StatBlock label="Time" value={fmtTime(consensus.avg_brew_time_s)} />
        <StatBlock label="Temp" value={fmtNum(consensus.avg_water_temp_c)} unit="°C" />
        <StatBlock label="Grind" value={GRIND_LABELS[consensus.modal_grind]} />
      </div>

      <footer className="flex items-center justify-between gap-2">
        <RatingDots value={Number(consensus.avg_rating)} />
        <span className="text-[11px] text-muted-foreground">
          averages · modal grind
        </span>
      </footer>
    </section>
  )
}
