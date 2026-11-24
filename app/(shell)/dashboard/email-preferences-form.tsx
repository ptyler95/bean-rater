"use client"

import { useActionState } from "react"
import { updateEmailPreferences } from "./actions"
import { Button } from "@/components/ui/button"

export function EmailPreferencesForm({ optedIn }: { optedIn: boolean }) {
  const [state, formAction, pending] = useActionState(updateEmailPreferences, null)

  return (
    <form action={formAction} className="space-y-3">
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          name="marketing_opt_in"
          defaultChecked={optedIn}
          className="mt-0.5 size-4 accent-primary"
        />
        <span>
          Email me occasional news and updates from Grounded. Sign-in emails
          are always sent regardless of this setting.
        </span>
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
        {state?.ok && <p className="text-xs text-muted-foreground">Saved.</p>}
      </div>
    </form>
  )
}
