"use client"

import { useActionState } from "react"
import { requestBrandClaim } from "./actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function ClaimForm({
  brandId,
  brandName,
  slug,
}: {
  brandId: string
  brandName: string
  slug: string
}) {
  const [state, formAction, pending] = useActionState(requestBrandClaim, null)

  if (state?.ok) {
    return (
      <p className="text-sm text-muted-foreground">
        Claim submitted — an admin will review it shortly.
      </p>
    )
  }

  return (
    <form action={formAction} className="space-y-2 max-w-lg">
      <input type="hidden" name="brand_id" value={brandId} />
      <input type="hidden" name="slug" value={slug} />
      <p className="text-sm text-muted-foreground">
        Claim this page to manage {brandName}&apos;s catalog: add and edit
        bags, publish them roaster-verified, and fill in your profile.
      </p>
      <Textarea
        name="message"
        required
        minLength={10}
        maxLength={1000}
        rows={3}
        placeholder="Who are you at the roastery? A work email domain or role helps us verify quickly."
      />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Submitting…" : "Request to claim"}
      </Button>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  )
}
