import { ImageResponse } from "next/og"
import { createClient } from "@/lib/supabase/server"
import { SITE_NAME, OG_COLORS } from "@/lib/site"
import { ROAST_LEVEL_LABELS, PROCESS_LABELS } from "@/lib/labels"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "Bag details and community recipe stats"

export default async function OgImage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const [{ data: bag }, { data: recipes }] = await Promise.all([
    supabase
      .from("bags")
      .select("coffee_name, origin, roast_level, process, brands(name)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("recipes").select("rating").eq("bag_id", id),
  ])

  const count = recipes?.length ?? 0
  const avg =
    count > 0
      ? (recipes!.reduce((s, r) => s + r.rating, 0) / count).toFixed(1)
      : null

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          backgroundColor: OG_COLORS.background,
          color: OG_COLORS.foreground,
          fontSize: 28,
        }}
      >
        <div
          style={{
            display: "flex",
            textTransform: "uppercase",
            letterSpacing: 4,
            fontSize: 24,
            color: OG_COLORS.muted,
          }}
        >
          {bag?.brands?.name ?? SITE_NAME}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 700, lineHeight: 1.05 }}>
            {bag?.coffee_name ?? "Coffee bag"}
          </div>
          {bag && (
            <div style={{ display: "flex", fontSize: 30, color: OG_COLORS.muted }}>
              {bag.origin} · {ROAST_LEVEL_LABELS[bag.roast_level]} ·{" "}
              {PROCESS_LABELS[bag.process]}
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div style={{ display: "flex", gap: 40, fontSize: 32 }}>
            <div style={{ display: "flex", color: OG_COLORS.primary, fontWeight: 700 }}>
              {count} {count === 1 ? "recipe" : "recipes"}
            </div>
            {avg && (
              <div style={{ display: "flex", color: OG_COLORS.primary, fontWeight: 700 }}>
                {avg} ★
              </div>
            )}
          </div>
          <div style={{ display: "flex", fontSize: 30, color: OG_COLORS.muted }}>
            {SITE_NAME}
          </div>
        </div>
      </div>
    ),
    size
  )
}
