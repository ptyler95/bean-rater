import { SITE_NAME, SITE_DESCRIPTION, siteUrl } from "@/lib/site"
import { BREW_METHOD_LABELS, GRIND_LABELS } from "@/lib/labels"
import type { Enums } from "@/lib/database.types"

/**
 * schema.org JSON-LD builders (WebSite, Organization, Product, Brand,
 * Recipe, BreadcrumbList, ItemList). Builders take data the pages already
 * fetch; no extra queries. Search engines and AI crawlers both read these.
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

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: siteUrl(),
    description: SITE_DESCRIPTION,
  }
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  const base = siteUrl()
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${base}${item.path}`,
    })),
  }
}

export function itemListSchema(
  name: string,
  items: { name: string; path: string }[]
) {
  const base = siteUrl()
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: `${base}${item.path}`,
    })),
  }
}

function isoDuration(totalSeconds: number): string {
  const s = Math.max(Math.round(totalSeconds), 0)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `PT${m ? `${m}M` : ""}${sec || !m ? `${sec}S` : ""}`
}

const round1 = (n: number) => Math.round(n * 10) / 10

/**
 * One Recipe per brew method for a bag, built from the community consensus
 * (averages across submitted recipes — not a single person's recipe).
 */
export function bagRecipeSchemas(
  bag: { id: string; coffeeName: string; brandName: string | null },
  consensus: {
    brew_method: Enums<"brew_method">
    recipe_count: number
    avg_dose_g: number
    avg_yield_g: number
    avg_water_ml: number
    avg_brew_time_s: number
    avg_water_temp_c: number
    avg_rating: number
    modal_grind: Enums<"grind_category">
  }[]
) {
  const base = siteUrl()
  const bagName = `${bag.brandName ? `${bag.brandName} ` : ""}${bag.coffeeName}`
  return consensus
    .filter((c) => c.recipe_count > 0)
    .map((c) => {
      const method = BREW_METHOD_LABELS[c.brew_method]
      const ingredients = [
        `${round1(c.avg_dose_g)} g ground coffee (${bagName})`,
      ]
      if (c.avg_water_ml) {
        ingredients.push(`${round1(c.avg_water_ml)} ml water at ${round1(c.avg_water_temp_c)}°C`)
      }
      const steps = [
        `Grind ${GRIND_LABELS[c.modal_grind].toLowerCase()}.`,
        `Brew with a ${method.toLowerCase()} using ${round1(c.avg_dose_g)} g coffee${
          c.avg_yield_g ? ` for about ${round1(c.avg_yield_g)} g in the cup` : ""
        } at ${round1(c.avg_water_temp_c)}°C.`,
        `Aim for about ${isoDurationLabel(c.avg_brew_time_s)} brew time.`,
      ]
      const schema: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "Recipe",
        name: `${method} recipe for ${bagName}`,
        description: `Average of ${c.recipe_count} community ${method.toLowerCase()} ${
          c.recipe_count === 1 ? "recipe" : "recipes"
        } for ${bagName} on ${SITE_NAME}.`,
        url: `${base}/bags/${bag.id}`,
        image: `${base}/opengraph-image`,
        recipeCategory: "Coffee",
        keywords: `${method}, ${bag.coffeeName}${bag.brandName ? `, ${bag.brandName}` : ""}, coffee brewing`,
        totalTime: isoDuration(c.avg_brew_time_s),
        recipeIngredient: ingredients,
        recipeInstructions: steps.map((text) => ({ "@type": "HowToStep", text })),
        author: { "@type": "Organization", name: `${SITE_NAME} community` },
      }
      if (c.avg_rating) {
        schema.aggregateRating = {
          "@type": "AggregateRating",
          ratingValue: round1(c.avg_rating),
          ratingCount: c.recipe_count,
          bestRating: 5,
          worstRating: 1,
        }
      }
      return schema
    })
}

function isoDurationLabel(totalSeconds: number): string {
  const s = Math.round(totalSeconds)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m ? `${m}:${String(sec).padStart(2, "0")} (m:ss)` : `${sec} seconds`
}
