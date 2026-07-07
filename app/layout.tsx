import type { Metadata } from "next"
import Link from "next/link"
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google"
import { SiteHeader } from "@/components/site-header"
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
  title: {
    default: "Bean Rater",
    template: "%s · Bean Rater",
  },
  description:
    "Community brew recipes for specific bags of coffee. Doses, temps, and times — not vibes.",
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
            <p className="font-heading text-lg">Bean Rater</p>
            <nav className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/bags" className="hover:text-foreground">
                Browse
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
      </body>
    </html>
  )
}
