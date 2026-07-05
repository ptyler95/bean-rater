"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { recipeSchema } from "@/lib/recipe-schema"

export async function submitRecipe(
  bagId: string,
  raw: unknown
): Promise<{ error: string } | void> {
  const parsed = recipeSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: "Invalid recipe data — check the highlighted fields." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/bags/${bagId}/submit`)}`)
  }

  const { error } = await supabase.from("recipes").insert({
    ...parsed.data,
    bag_id: bagId,
    user_id: user.id,
  })

  if (error) {
    if (error.code === "23505") {
      return {
        error:
          "You've already logged a recipe for this bag and brew method — one per combo keeps the consensus honest.",
      }
    }
    return { error: error.message }
  }

  revalidatePath(`/bags/${bagId}`)
  redirect(`/bags/${bagId}`)
}
