/**
 * Label-over-value spec block. Values render in mono so recipe specs
 * read like instrument output.
 */
export function StatBlock({
  label,
  value,
  unit,
}: {
  label: string
  value: string
  unit?: string
}) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="font-mono text-lg leading-tight tabular-nums break-words">
        {value}
        {unit && value !== "—" && (
          <span className="text-xs text-muted-foreground ml-0.5">{unit}</span>
        )}
      </div>
    </div>
  )
}
