import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/site"

const DISALLOW = ["/admin", "/dashboard", "/login", "/auth/"]

// AI search and answer-engine crawlers. Named explicitly so the intent is
// unambiguous: public pages may be crawled, cited, and used for answers.
// A named group replaces the "*" group, so the private paths repeat here.
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: DISALLOW },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  }
}
