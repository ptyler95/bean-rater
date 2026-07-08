"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function updateDisplayName(
  _prev: { ok?: boolean; error?: string } | null,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const name = (formData.get("display_name") as string)?.trim()
  if (!name || name.length > 40) {
    return { error: "Display name must be 1–40 characters." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not signed in." }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: name })
    .eq("user_id", user.id)
  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  return { ok: true }
}

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
