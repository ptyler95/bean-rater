"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type ActionState = { ok?: boolean; error?: string } | null

/** Email-input + submit for admin actions like "make moderator" or "ban". */
export function EmailActionForm({
  action,
  buttonLabel,
  pendingLabel,
  successLabel,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>
  buttonLabel: string
  pendingLabel: string
  successLabel: string
}) {
  const [state, formAction, pending] = useActionState(action, null)

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <Input
        name="email"
        type="email"
        required
        placeholder="user@example.com"
        className="w-56"
        aria-label="User email"
      />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? pendingLabel : buttonLabel}
      </Button>
      {state?.error && <p className="text-xs text-destructive w-full">{state.error}</p>}
      {state?.ok && <p className="text-xs text-muted-foreground w-full">{successLabel}</p>}
    </form>
  )
}
