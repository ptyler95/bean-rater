"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function deleteRecipe(formData: FormData) {
  const recipeId = formData.get("recipe_id") as string
  const bagId = formData.get("bag_id") as string
  if (!recipeId) return

  const supabase = await createClient()
  // RLS: users delete only their own recipes (admins any).
  await supabase.from("recipes").delete().eq("id", recipeId)

  revalidatePath("/dashboard")
  if (bagId) revalidatePath(`/bags/${bagId}`)
}
