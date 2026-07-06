"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { Constants, type Enums } from "@/lib/database.types"

// All actions run as the signed-in user; RLS (admin policies, moderation
// guard trigger) is the real enforcement layer.

function revalidateBag(bagId: string) {
  revalidatePath("/admin")
  revalidatePath(`/bags/${bagId}`)
  revalidatePath("/")
}

export async function setBagHidden(formData: FormData) {
  const bagId = formData.get("bag_id") as string
  const hide = formData.get("hide") === "true"
  const supabase = await createClient()

  if (hide) {
    await supabase.from("bags").update({ flagged: true }).eq("id", bagId)
  } else {
    // Republish with a clean slate: reset the counter and clear old reports
    // so a single new flag doesn't immediately re-hide it.
    await supabase
      .from("bags")
      .update({ flagged: false, flag_count: 0 })
      .eq("id", bagId)
    await supabase.from("bag_flags").delete().eq("bag_id", bagId)
  }
  revalidateBag(bagId)
}

export async function setBagVerification(formData: FormData) {
  const bagId = formData.get("bag_id") as string
  const status = formData.get("status") as string
  if (
    !(Constants.public.Enums.verification_status as readonly string[]).includes(
      status
    )
  ) {
    return
  }
  const supabase = await createClient()
  await supabase
    .from("bags")
    .update({ verification_status: status as Enums<"verification_status"> })
    .eq("id", bagId)
  revalidateBag(bagId)
}

export async function deleteBag(formData: FormData) {
  const bagId = formData.get("bag_id") as string
  const supabase = await createClient()
  await supabase.from("bags").delete().eq("id", bagId)
  revalidatePath("/admin")
  revalidatePath("/")
}

export async function assignBrandAdmin(
  _prev: { ok?: boolean; error?: string } | null,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const email = (formData.get("email") as string)?.trim()
  const brandSlug = (formData.get("brand_slug") as string) || null
  if (!email) return { error: "Email is required." }

  const supabase = await createClient()
  const { error } = await supabase.rpc("assign_brand_admin", {
    p_email: email,
    p_brand_slug: brandSlug,
  })
  if (error) return { error: error.message }
  revalidatePath("/admin")
  return { ok: true }
}

export async function revokeBrandAdmin(formData: FormData) {
  const email = formData.get("email") as string
  if (!email) return
  const supabase = await createClient()
  await supabase.rpc("assign_brand_admin", {
    p_email: email,
    p_brand_slug: null,
  })
  revalidatePath("/admin")
}
