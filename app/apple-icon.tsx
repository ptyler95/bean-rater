import { ImageResponse } from "next/og"
import { OG_COLORS, SITE_NAME } from "@/lib/site"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"
export const alt = SITE_NAME

// Coffee-bean mark on the deep-olive brand tile, matching app/icon.svg.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: OG_COLORS.primary,
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g transform="rotate(-32 32 32)">
            <ellipse cx="32" cy="32" rx="15" ry="22" fill={OG_COLORS.background} />
            <path
              d="M32 11c-4.5 6.5-4.5 14.5 0 21s4.5 14.5 0 21"
              stroke={OG_COLORS.primary}
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        </svg>
      </div>
    ),
    size
  )
}
