/** "245" -> "245", "17.50" -> "17.5" — trims trailing zeros from numerics. */
export function fmtNum(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "—"
  const n = typeof value === "string" ? parseFloat(value) : value
  if (Number.isNaN(n)) return "—"
  return String(parseFloat(n.toFixed(2)))
}

/** Seconds -> instrument-style duration: 28 -> "28s", 165 -> "2:45", 43200 -> "12h". */
export function fmtTime(seconds: number | string | null | undefined): string {
  if (seconds === null || seconds === undefined) return "—"
  const s = Math.round(
    typeof seconds === "string" ? parseFloat(seconds) : seconds
  )
  if (Number.isNaN(s)) return "—"
  if (s >= 3600) {
    const h = Math.floor(s / 3600)
    const m = Math.round((s % 3600) / 60)
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }
  if (s >= 60) {
    const m = Math.floor(s / 60)
    const rest = s % 60
    return `${m}:${String(rest).padStart(2, "0")}`
  }
  return `${s}s`
}
