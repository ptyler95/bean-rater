import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { logout } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"
import { SITE_NAME } from "@/lib/site"

export async function SiteHeader() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let displayName: string | null = null
  let role: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, role")
      .eq("user_id", user.id)
      .maybeSingle()
    displayName = profile?.display_name ?? user.email ?? null
    role = profile?.role ?? null
  }
  const showAdmin = role === "admin" || role === "brand_admin"

  return (
    <header className="border-b bg-background/95 sticky top-0 z-40 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-6xl px-5 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-8 min-w-0">
          <Link href="/" className="font-heading text-2xl tracking-tight">
            {SITE_NAME}
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/bags" className="hover:text-foreground">
              Browse
            </Link>
            <Link href="/roasters" className="hover:text-foreground">
              Roasters
            </Link>
            <Link href="/bags/new" className="hover:text-foreground">
              Add a bag
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          {showAdmin && (
            <Button nativeButton={false} render={<Link href="/admin" />} variant="ghost" size="sm">
              {role === "brand_admin" ? "My roaster" : "Admin"}
            </Button>
          )}
          {user ? (
            <>
              <Button
                nativeButton={false}
                render={<Link href="/dashboard" />}
                variant="ghost"
                size="sm"
              >
                My recipes
              </Button>
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
