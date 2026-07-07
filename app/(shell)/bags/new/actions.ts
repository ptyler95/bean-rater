"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { bagSchema } from "@/lib/bag-schema"

export async function createBag(
  raw: unknown
): Promise<{ error: string } | void> {
  const parsed = bagSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: "Invalid bag data — check the highlighted fields." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/login?next=${encodeURIComponent("/bags/new")}`)

  const { brand_name, ...bagFields } = parsed.data

  const { data: brandId, error: brandError } = await supabase.rpc(
    "find_or_create_brand",
    { p_name: brand_name }
  )
  if (brandError || !brandId) {
    return { error: brandError?.message ?? "Could not resolve brand." }
  }

  // A brand admin adding a bag for their own brand publishes it
  // roaster-verified; RLS double-checks this claim.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, brand_id")
    .eq("user_id", user.id)
    .maybeSingle()
  const roasterVerified =
    profile?.role === "brand_admin" && profile.brand_id === brandId

  const { data: bag, error } = await supabase
    .from("bags")
    .insert({
      ...bagFields,
      brand_id: brandId,
      added_by: user.id,
      verification_status: roasterVerified ? "roaster_verified" : "unverified",
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  revalidatePath("/")
  redirect(`/bags/${bag.id}`)
}
