"use client"

import { useActionState } from "react"
import { updateDisplayName } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function DisplayNameForm({ current }: { current: string }) {
  const [state, formAction, pending] = useActionState(updateDisplayName, null)

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <Input
        name="display_name"
        defaultValue={current}
        required
        maxLength={40}
        className="w-56"
        aria-label="Display name"
      />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
      {state?.error && <p className="text-xs text-destructive w-full">{state.error}</p>}
      {state?.ok && <p className="text-xs text-muted-foreground w-full">Saved.</p>}
    </form>
  )
}
