import type { Metadata } from "next"
import Link from "next/link"
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { GoogleTagManager, GoogleAnalytics } from "@next/third-parties/google"
import { SiteHeader } from "@/components/site-header"
import { JsonLd } from "@/components/json-ld"
import { websiteSchema } from "@/lib/schema"
import {
  SITE_NAME,
  SITE_DESCRIPTION,
  siteUrl,
  GTM_ID,
  GA4_ID,
  analyticsEnabled,
} from "@/lib/site"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <JsonLd data={websiteSchema()} />
        {analyticsEnabled && (
          <>
            <GoogleTagManager gtmId={GTM_ID} />
            <GoogleAnalytics gaId={GA4_ID} />
            {/* GTM <noscript> fallback — the third-parties component omits it. */}
            <noscript>
              <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
                height="0"
                width="0"
                style={{ display: "none", visibility: "hidden" }}
                title="Google Tag Manager"
              />
            </noscript>
          </>
        )}
        <SiteHeader />
        <main className="flex-1 w-full">{children}</main>
        <footer className="border-t py-10">
          <div className="mx-auto w-full max-w-6xl px-5 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-heading text-lg">{SITE_NAME}</p>
            <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <Link href="/bags" className="hover:text-foreground">
                Browse
              </Link>
              <Link href="/roasters" className="hover:text-foreground">
                Roasters
              </Link>
              <Link href="/bags/new" className="hover:text-foreground">
                Add a bag
              </Link>
              <Link href="/about" className="hover:text-foreground">
                About
              </Link>
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground">
                Terms
              </Link>
            </nav>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  )
}
