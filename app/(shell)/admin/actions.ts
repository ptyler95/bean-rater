"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { Constants, type Enums } from "@/lib/database.types"

// All actions run as the signed-in user; RLS (admin policies, moderation
// guard trigger) is the real enforcement layer.

function revalidateBag(bagId: string) {
  revalidatePath("/admin")
  revalidatePath(`/bags/${bagId}`)
  revalidatePath("/bags")
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
  revalidatePath("/bags")
  revalidatePath("/")
}

export async function assignBrandAdmin(
  _prev: { ok?: boolean; error?: string } | null,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const email = (formData.get("email") as string)?.trim()
  const brandSlug = (formData.get("brand_slug") as string) || undefined
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

export async function resolveBrandClaim(formData: FormData) {
  const claimId = formData.get("claim_id") as string
  const approve = formData.get("approve") === "true"
  const brandSlug = formData.get("brand_slug") as string
  if (!claimId) return

  const supabase = await createClient()
  await supabase.rpc("resolve_brand_claim", {
    p_claim_id: claimId,
    p_approve: approve,
  })
  revalidatePath("/admin")
  if (brandSlug) revalidatePath(`/roasters/${brandSlug}`)
}

export async function updateBrandProfile(
  _prev: { ok?: boolean; error?: string } | null,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const brandId = formData.get("brand_id") as string
  const brandSlug = formData.get("brand_slug") as string
  const description = ((formData.get("description") as string) ?? "").trim()
  const website = ((formData.get("website") as string) ?? "").trim()
  const logoUrl = ((formData.get("logo_url") as string) ?? "").trim()
  if (!brandId) return { error: "Missing brand." }
  if (description.length > 600) {
    return { error: "Description must be 600 characters or fewer." }
  }
  for (const [label, url] of [
    ["Website", website],
    ["Logo URL", logoUrl],
  ] as const) {
    if (url && !/^https?:\/\//i.test(url)) {
      return { error: `${label} must be an http(s) URL.` }
    }
  }

  const supabase = await createClient()
  // Blank strings clear the fields; the RPC nullifs them server-side.
  const { error } = await supabase.rpc("update_brand_profile", {
    p_brand_id: brandId,
    p_description: description,
    p_website: website,
    p_logo_url: logoUrl,
  })
  if (error) return { error: error.message }
  revalidatePath("/admin")
  if (brandSlug) revalidatePath(`/roasters/${brandSlug}`)
  return { ok: true }
}

export async function revokeBrandAdmin(formData: FormData) {
  const email = formData.get("email") as string
  if (!email) return
  const supabase = await createClient()
  // Omitting p_brand_slug demotes back to a regular user.
  await supabase.rpc("assign_brand_admin", { p_email: email })
  revalidatePath("/admin")
}
