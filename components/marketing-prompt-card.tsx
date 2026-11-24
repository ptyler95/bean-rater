"use client"

import { useState, useTransition } from "react"
import { setMarketingOptIn } from "@/app/(shell)/dashboard/actions"
import { Button } from "@/components/ui/button"

export function MarketingPromptCard() {
  const [hidden, setHidden] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (hidden) return null

  function answer(optIn: boolean) {
    startTransition(async () => {
      const res = await setMarketingOptIn(optIn, "prompt")
      if (res.error) setError(res.error)
      else setHidden(true)
    })
  }

  return (
    <section
      aria-label="Email preferences"
      className="mt-6 rounded-md border bg-card p-4 space-y-3"
    >
      <div className="space-y-1">
        <h2 className="text-sm font-semibold">Want occasional news from Grounded?</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          New features, new roasters, and the occasional brewing tip. No spam,
          unsubscribe any time. Not subscribing doesn&apos;t affect your
          account or sign-in emails, and you can change this on your dashboard.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" disabled={pending} onClick={() => answer(true)}>
          Yes, email me
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => answer(false)}
        >
          No thanks
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </section>
  )
}
