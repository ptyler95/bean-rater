"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { bagEditSchema } from "@/lib/bag-schema"

export async function updateBag(
  bagId: string,
  raw: unknown
): Promise<{ error: string } | void> {
  const parsed = bagEditSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: "Invalid bag data — check the highlighted fields." }
  }

  const supabase = await createClient()
  // Authority is enforced by RLS (admin or brand admin of this bag's brand).
  // Optional fields cleared in the form must overwrite, so undefined -> null.
  const d = parsed.data
  const { error, count } = await supabase
    .from("bags")
    .update(
      {
        coffee_name: d.coffee_name,
        origin: d.origin,
        region: d.region ?? null,
        roast_level: d.roast_level,
        process: d.process,
        bag_size: d.bag_size ?? null,
        varietal: d.varietal ?? null,
        altitude_masl: d.altitude_masl ?? null,
        product_url: d.product_url ?? null,
        verification_status: d.verification_status,
      },
      { count: "exact" }
    )
    .eq("id", bagId)

  if (error) return { error: error.message }
  if (count === 0) return { error: "You don't have permission to edit this bag." }

  revalidatePath(`/bags/${bagId}`)
  revalidatePath("/admin")
  revalidatePath("/")
  redirect(`/bags/${bagId}`)
}
