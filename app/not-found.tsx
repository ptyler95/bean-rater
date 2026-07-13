import Link from "next/link"
import type { Metadata } from "next"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Page not found",
}

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5">
      <div className="rounded-md border border-dashed bg-card px-6 py-14 text-center space-y-3 mt-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          404 — Not found
        </p>
        <p className="text-sm text-muted-foreground">
          This page doesn&apos;t exist — maybe the bag was retired.
        </p>
        <div className="flex justify-center gap-2 pt-1">
          <Button size="sm" nativeButton={false} render={<Link href="/bags" />}>
            Browse bags
          </Button>
        </div>
      </div>
    </div>
  )
}
