import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { logout } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"

export async function SiteHeader() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let displayName: string | null = null
  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, role")
      .eq("user_id", user.id)
      .maybeSingle()
    displayName = profile?.display_name ?? user.email ?? null
    isAdmin = profile?.role === "admin"
  }

  return (
    <header className="border-b bg-background/95 sticky top-0 z-40 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="font-mono text-sm font-bold uppercase tracking-[0.2em]"
        >
          Bean<span className="text-primary">·</span>Rater
        </Link>
        <div className="flex items-center gap-2 min-w-0">
          {isAdmin && (
            <Button nativeButton={false} render={<Link href="/admin" />} variant="ghost" size="sm">
              Admin
            </Button>
          )}
          {user ? (
            <>
              <span className="hidden sm:block text-xs text-muted-foreground truncate max-w-40">
                {displayName}
              </span>
              <form action={logout}>
                <Button type="submit" variant="outline" size="sm">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <Button nativeButton={false} render={<Link href="/login" />} variant="outline" size="sm">
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
