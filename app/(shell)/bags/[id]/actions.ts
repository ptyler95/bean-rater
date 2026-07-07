"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function flagBag(
  _prev: { ok?: boolean; error?: string } | null,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const bagId = formData.get("bag_id") as string
  if (!bagId) return { error: "Missing bag." }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/login?next=${encodeURIComponent(`/bags/${bagId}`)}`)

  const { error } = await supabase
    .from("bag_flags")
    .insert({ bag_id: bagId, user_id: user.id })

  if (error) {
    if (error.code === "23505") {
      return { error: "You've already flagged this listing." }
    }
    return { error: error.message }
  }

  revalidatePath(`/bags/${bagId}`)
  return { ok: true }
}
