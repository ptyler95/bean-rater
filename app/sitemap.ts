import type { MetadataRoute } from "next"
import { createClient } from "@/lib/supabase/server"
import { siteUrl } from "@/lib/site"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const supabase = await createClient()

  // Anon-context queries: RLS already excludes flagged bags.
  const [{ data: bags }, { data: brands }] = await Promise.all([
    supabase.from("bags").select("id, updated_at"),
    supabase.from("brands").select("slug, updated_at"),
  ])

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/bags`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/roasters`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.1 },
    ...(bags ?? []).map((b) => ({
      url: `${base}/bags/${b.id}`,
      lastModified: new Date(b.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...(brands ?? []).map((b) => ({
      url: `${base}/roasters/${b.slug}`,
      lastModified: new Date(b.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ]
}
