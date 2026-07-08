import { ImageResponse } from "next/og"
import { SITE_NAME, SITE_DESCRIPTION, OG_COLORS } from "@/lib/site"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = SITE_NAME

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 24,
          backgroundColor: OG_COLORS.background,
          color: OG_COLORS.foreground,
        }}
      >
        <div style={{ display: "flex", fontSize: 96, fontWeight: 700 }}>
          {SITE_NAME}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 34,
            color: OG_COLORS.muted,
            maxWidth: 900,
            textAlign: "center",
          }}
        >
          {SITE_DESCRIPTION}
        </div>
      </div>
    ),
    size
  )
}
