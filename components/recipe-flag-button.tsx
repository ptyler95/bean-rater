"use client"

import { useActionState } from "react"
import { flagRecipe } from "@/app/(shell)/bags/[id]/actions"
import { Button } from "@/components/ui/button"

/** Discreet per-recipe report control; three reports hide the recipe. */
export function RecipeFlagButton({
  recipeId,
  bagId,
}: {
  recipeId: string
  bagId: string
}) {
  const [state, formAction, pending] = useActionState(flagRecipe, null)

  if (state?.ok) {
    return <span className="text-[11px] text-muted-foreground">Reported</span>
  }

  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="recipe_id" value={recipeId} />
      <input type="hidden" name="bag_id" value={bagId} />
      <Button
        type="submit"
        variant="ghost"
        size="xs"
        disabled={pending}
        className="text-muted-foreground/70 hover:text-destructive text-[11px]"
      >
        {pending ? "Reporting…" : "Report"}
      </Button>
      {state?.error && (
        <span className="text-[11px] text-destructive">{state.error}</span>
      )}
    </form>
  )
}
