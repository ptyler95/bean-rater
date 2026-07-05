"use client"

import { useActionState } from "react"
import { flagBag } from "./actions"
import { Button } from "@/components/ui/button"

export function FlagButton({ bagId }: { bagId: string }) {
  const [state, formAction, pending] = useActionState(flagBag, null)

  if (state?.ok) {
    return (
      <p className="text-xs text-muted-foreground">
        Flagged for review. Thanks — three independent flags hide a listing.
      </p>
    )
  }

  return (
    <form action={formAction} className="space-y-1">
      <input type="hidden" name="bag_id" value={bagId} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        disabled={pending}
        className="text-muted-foreground hover:text-destructive"
      >
        {pending ? "Flagging…" : "⚑ Flag incorrect or spam listing"}
      </Button>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  )
}
