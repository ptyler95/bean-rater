import type { Metadata } from "next"
import Link from "next/link"
import { Inter, JetBrains_Mono } from "next/font/google"
import { SiteHeader } from "@/components/site-header"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 pb-16">
          {children}
        </main>
        <footer className="border-t py-6">
          <div className="max-w-3xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            <p>Bean Rater — community brew data</p>
            <nav className="flex gap-4">
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
