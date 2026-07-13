/** Single source of truth for branding — the rename touches this file,
 * the legal pages, and homepage copy only. */
export const SITE_NAME = "Grounded"

export const SITE_DESCRIPTION =
  "Community brew recipes for specific bags of coffee. Doses, temps, and times — not vibes."

/** Absolute origin for metadata and OG URLs. Production: groundedbeans.com. */
export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.VERCEL_ENV === "production") return "https://groundedbeans.com"
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return "http://localhost:3000"
}

/** Google Tag Manager container + GA4 measurement IDs. */
export const GTM_ID = "GTM-MHN4WQ2R"
export const GA4_ID = "G-X64ZN6QLJB"

/** Only fire analytics on the live production deploy — keeps localhost and
 * Vercel preview traffic out of the data. */
export const analyticsEnabled = process.env.VERCEL_ENV === "production"

/** Brand palette as hex for OG images (satori doesn't parse oklch). */
export const OG_COLORS = {
  background: "#F3F5EA", // pale sage
  foreground: "#333A2E", // ink olive
  primary: "#4C6130", // deep olive
  muted: "#6C7460",
} as const
