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

  const { data: bag, error } = await supabase
    .from("bags")
    .insert({
      ...bagFields,
      brand_id: brandId,
      added_by: user.id,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  revalidatePath("/")
  redirect(`/bags/${bag.id}`)
}
