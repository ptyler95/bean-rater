"use client"

import { Button } from "@/components/ui/button"

export default function ShellError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="rounded-md border border-dashed bg-card px-6 py-14 text-center space-y-3 mt-10">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        Something went wrong
      </p>
      <p className="text-sm text-muted-foreground">
        That didn&apos;t brew right. Try again, or head back to the bags.
      </p>
      <div className="flex justify-center gap-2 pt-1">
        <Button size="sm" variant="outline" onClick={() => reset()}>
          Try again
        </Button>
        <Button size="sm" onClick={() => (window.location.href = "/bags")}>
          Browse bags
        </Button>
      </div>
    </div>
  )
}
