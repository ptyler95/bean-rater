import { NextResponse } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

// Handles both magic-link formats:
// - default Supabase email template: verify endpoint redirects here with ?code=
// - token_hash template ({{ .TokenHash }}): arrives as ?token_hash=&type=
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  // Same-site paths only — an absolute or protocol-relative `next`
  // would turn this callback into an open redirect.
  const rawNext = searchParams.get("next") ?? "/"
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/"

  const supabase = await createClient()

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(new URL(next, origin))
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, origin))
  }

  return NextResponse.redirect(new URL("/login?error=expired", origin))
}
