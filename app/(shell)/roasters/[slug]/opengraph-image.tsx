import { ImageResponse } from "next/og"
import { createClient } from "@/lib/supabase/server"
import { SITE_NAME, OG_COLORS } from "@/lib/site"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "Roaster catalog and community recipe stats"

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.rpc("browse_roasters", { p_slug: slug })
  const roaster = data?.[0]

  const bags = Number(roaster?.bag_count ?? 0)
  const recipes = Number(roaster?.recipe_count ?? 0)

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
          backgroundColor: OG_COLORS.primary,
          color: "#F5F7EC",
          fontSize: 28,
        }}
      >
        <div
          style={{
            display: "flex",
            textTransform: "uppercase",
            letterSpacing: 4,
            fontSize: 24,
            opacity: 0.8,
          }}
        >
          Roaster
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", fontSize: 80, fontWeight: 700, lineHeight: 1.05 }}>
            {roaster?.name ?? "Roaster"}
          </div>
          <div style={{ display: "flex", fontSize: 32, opacity: 0.85 }}>
            {bags} {bags === 1 ? "bag" : "bags"} · {recipes}{" "}
            {recipes === 1 ? "community recipe" : "community recipes"}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 30, opacity: 0.8 }}>
          {SITE_NAME}
        </div>
      </div>
    ),
    size
  )
}
