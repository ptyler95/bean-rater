import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BagEditForm } from "./edit-form"
import { Constants } from "@/lib/database.types"

export const metadata = { title: "Edit bag" }

export default async function EditBagPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: bag }, { data: profile }] = await Promise.all([
    supabase.from("bags").select("*, brands(name)").eq("id", id).maybeSingle(),
    user
      ? supabase
          .from("profiles")
          .select("role, brand_id")
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  if (!bag) notFound()

  const isAdmin = profile?.role === "admin"
  const isBrandAdmin =
    profile?.role === "brand_admin" && profile.brand_id === bag.brand_id

  if (!isAdmin && !isBrandAdmin) {
    return (
      <div className="pt-16 text-center space-y-2">
        <h1 className="text-lg font-semibold">No edit access</h1>
        <p className="text-sm text-muted-foreground">
          Only site admins or this brand&apos;s admin can edit a bag.
        </p>
      </div>
    )
  }

  const allowedVerification = isAdmin
    ? Constants.public.Enums.verification_status
    : (["unverified", "roaster_verified"] as const)

  return (
    <div className="pt-8 max-w-md mx-auto space-y-6">
      <header className="space-y-1">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Editing — {bag.brands?.name}
        </p>
        <h1 className="text-xl font-semibold tracking-tight">{bag.coffee_name}</h1>
        {bag.flagged && (
          <p className="text-xs text-destructive">
            This bag is currently hidden from the public site.
          </p>
        )}
      </header>

      <BagEditForm bag={bag} allowedVerification={allowedVerification} />
    </div>
  )
}
