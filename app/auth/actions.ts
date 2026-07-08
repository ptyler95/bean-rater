"use server"

import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"

export async function sendMagicLink(
  _prev: { ok?: boolean; error?: string } | null,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const email = (formData.get("email") as string)?.trim()
  const next = (formData.get("next") as string) || "/"
  if (!email) return { error: "Enter your email address." }

  const headerList = await headers()
  const originHeader = headerList.get("origin") ?? headerList.get("referer")
  let redirectTo: string | undefined
  try {
    if (originHeader) {
      redirectTo = `${new URL(originHeader).origin}/auth/confirm?next=${encodeURIComponent(next)}`
    }
  } catch {
    // Malformed header — omit emailRedirectTo and let Supabase use the Site URL.
  }
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  })

  if (error) return { error: error.message }
  return { ok: true }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}
