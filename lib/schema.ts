import { SITE_NAME, SITE_DESCRIPTION, siteUrl } from "@/lib/site"

/**
 * schema.org JSON-LD builders — kept to the few types search engines
 * actually read (WebSite, Product, Brand). Builders take data the pages
 * already fetch; no extra queries.
 */

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: siteUrl(),
  }
}

export function bagProductSchema(bag: {
  id: string
  coffeeName: string
  brandName: string | null
  origin: string
  roastLabel: string
  ratings: number[]
}) {
  const base = siteUrl()
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: bag.coffeeName,
    description: `Community brew recipes for ${
      bag.brandName ? `${bag.brandName} ` : ""
    }${bag.coffeeName} (${bag.origin}, ${bag.roastLabel} roast) on ${SITE_NAME}.`,
    url: `${base}/bags/${bag.id}`,
    category: "Coffee",
  }
  if (bag.brandName) {
    schema.brand = { "@type": "Brand", name: bag.brandName }
  }
  if (bag.ratings.length > 0) {
    const avg = bag.ratings.reduce((sum, r) => sum + r, 0) / bag.ratings.length
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Math.round(avg * 10) / 10,
      ratingCount: bag.ratings.length,
      bestRating: 5,
      worstRating: 1,
    }
  }
  return schema
}

export function roasterBrandSchema(roaster: {
  slug: string
  name: string
  description: string | null
  logoUrl: string | null
  website: string | null
}) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Brand",
    name: roaster.name,
    url: `${siteUrl()}/roasters/${roaster.slug}`,
  }
  if (roaster.description) schema.description = roaster.description
  if (roaster.logoUrl) schema.logo = roaster.logoUrl
  if (roaster.website) schema.sameAs = [roaster.website]
  return schema
}
