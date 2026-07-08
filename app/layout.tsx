import type { Metadata } from "next"
import Link from "next/link"
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SiteHeader } from "@/components/site-header"
import { SITE_NAME, SITE_DESCRIPTION, siteUrl } from "@/lib/site"
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
        <SiteHeader />
        <main className="flex-1 w-full">{children}</main>
        <footer className="border-t py-10">
          <div className="mx-auto w-full max-w-6xl px-5 flex flex-wrap items-center justify-between gap-4">
            <p className="font-heading text-lg">{SITE_NAME}</p>
            <nav className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/bags" className="hover:text-foreground">
                Browse
              </Link>
              <Link href="/roasters" className="hover:text-foreground">
                Roasters
              </Link>
              <Link href="/bags/new" className="hover:text-foreground">
                Add a bag
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
