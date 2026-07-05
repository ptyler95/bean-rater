import { cn } from "@/lib/utils"

/** Five-dot rating scale (no stars). Accepts fractional averages. */
export function RatingDots({
  value,
  showValue = true,
  className,
}: {
  value: number
  showValue?: boolean
  className?: string
}) {
  const rounded = Math.round(value)
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="inline-flex items-center gap-1" aria-label={`Rated ${value} out of 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={cn(
              "size-2 rounded-full",
              i <= rounded ? "bg-primary" : "bg-border"
            )}
          />
        ))}
      </span>
      {showValue && (
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {parseFloat(value.toFixed(1))}
        </span>
      )}
    </span>
  )
}
