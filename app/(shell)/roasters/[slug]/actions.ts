"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function requestBrandClaim(
  _prev: { ok?: boolean; error?: string } | null,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const brandId = formData.get("brand_id") as string
  const message = ((formData.get("message") as string) ?? "").trim()
  if (!brandId) return { error: "Missing brand." }
  if (message.length < 10) {
    return { error: "Tell us a bit more — at least 10 characters." }
  }
  if (message.length > 1000) {
    return { error: "Keep it under 1000 characters." }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc("request_brand_claim", {
    p_brand_id: brandId,
    p_message: message,
  })
  if (error) return { error: error.message }

  const slug = formData.get("slug") as string
  if (slug) revalidatePath(`/roasters/${slug}`)
  return { ok: true }
}
