import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/ui/native-select"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BREW_METHOD_LABELS, VERIFICATION_LABELS } from "@/lib/labels"
import { Constants } from "@/lib/database.types"
import {
  assignModerator,
  banUser,
  deleteBag,
  deleteRecipeAdmin,
  resolveBrandClaim,
  revokeBrandAdmin,
  revokeModerator,
  setBagHidden,
  setBagVerification,
  setRecipeHidden,
  unbanUser,
} from "./actions"
import { AssignBrandAdminForm } from "./assign-form"
import { BrandProfileForm } from "./brand-profile-form"
import { EmailActionForm } from "./email-action-form"

export const metadata = { title: "Admin" }

const VIEWS = ["all", "hidden", "reported"] as const

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view: viewParam } = await searchParams
  const view = (VIEWS as readonly string[]).includes(viewParam ?? "")
    ? (viewParam as (typeof VIEWS)[number])
    : "all"

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("role, brand_id, brands(id, name, slug, description, website, logo_url)")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null }

  const isSuperadmin = profile?.role === "admin"
  const isModeration = isSuperadmin || profile?.role === "moderator"
  const isBrandAdmin = profile?.role === "brand_admin" && !!profile.brand_id

  if (!isModeration && !isBrandAdmin) {
    return (
      <div className="pt-16 text-center space-y-2">
        <h1 className="text-lg font-semibold">Admin only</h1>
        <p className="text-sm text-muted-foreground">
          Your account doesn&apos;t have an admin role.
        </p>
      </div>
    )
  }

  // RLS already scopes visibility; the eq() below just keeps brand admins'
  // view focused on their own catalog.
  let query = supabase
    .from("bags")
    .select("id, coffee_name, origin, flagged, flag_count, verification_status, created_at, brands(name)")
    .order("flag_count", { ascending: false })
    .order("created_at", { ascending: false })
  if (isBrandAdmin) query = query.eq("brand_id", profile!.brand_id!)
  if (view === "hidden") query = query.eq("flagged", true)
  if (view === "reported") query = query.gt("flag_count", 0)

  const [
    { data: bags },
    { data: brands },
    brandAdmins,
    claims,
    moderators,
    banned,
    { data: flaggedRecipes },
  ] = await Promise.all([
    query,
    isSuperadmin
      ? supabase.from("brands").select("name, slug").order("name")
      : Promise.resolve({ data: null }),
    isModeration ? supabase.rpc("list_brand_admins") : Promise.resolve({ data: null }),
    isModeration ? supabase.rpc("list_brand_claims") : Promise.resolve({ data: null }),
    isSuperadmin ? supabase.rpc("list_moderators") : Promise.resolve({ data: null }),
    isModeration ? supabase.rpc("list_banned_users") : Promise.resolve({ data: null }),
    isModeration
      ? supabase
          .from("recipes")
          .select(
            "id, bag_id, brew_method, flagged, flag_count, created_at, bags(coffee_name, brands(name)), profiles(display_name)"
          )
          .gt("flag_count", 0)
          .order("flag_count", { ascending: false })
      : Promise.resolve({ data: null }),
  ])
  const pendingClaims = claims?.data ?? []
  const reportedRecipes = flaggedRecipes ?? []

  return (
    <div className="pt-8 space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">
            {isModeration ? "Moderation" : `${profile?.brands?.name} — catalog`}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isModeration
              ? "Sorted by flag reports. Hidden bags stay visible here."
              : "Bags you manage. New bags you add are roaster-verified."}
          </p>
        </div>
        {isBrandAdmin && (
          <span className="flex items-center gap-3">
            <Link
              href={`/roasters/${profile?.brands?.slug}`}
              className="text-xs text-muted-foreground underline underline-offset-2"
            >
              View public page →
            </Link>
            <Button nativeButton={false} render={<Link href="/bags/new" />} size="sm">
              Add bag
            </Button>
          </span>
        )}
      </header>

      {/* View filter */}
      <nav className="flex gap-1">
        {VIEWS.map((v) => (
          <Link
            key={v}
            href={v === "all" ? "/admin" : `/admin?view=${v}`}
            className={`px-2.5 py-1 rounded-md font-mono text-xs uppercase tracking-wider ${
              view === v
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {v}
          </Link>
        ))}
      </nav>

      {(bags ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing in this view.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bag</TableHead>
                <TableHead className="text-right">Flags</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(bags ?? []).map((bag) => (
                <TableRow key={bag.id}>
                  <TableCell>
                    <Link
                      href={`/bags/${bag.id}`}
                      className="font-medium underline underline-offset-2"
                    >
                      {bag.coffee_name}
                    </Link>
                    <span className="block text-xs text-muted-foreground">
                      {bag.brands?.name} · {bag.origin}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {bag.flag_count}
                  </TableCell>
                  <TableCell>
                    <span className="flex flex-col items-start gap-1">
                      {bag.flagged && (
                        <Badge variant="destructive" className="font-mono text-[10px] uppercase">
                          Hidden
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {VERIFICATION_LABELS[bag.verification_status]}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        nativeButton={false}
                        render={<Link href={`/bags/${bag.id}/edit`} />}
                        variant="outline"
                        size="xs"
                      >
                        Edit
                      </Button>

                      {isModeration && (
                        <>
                          <form action={setBagHidden}>
                            <input type="hidden" name="bag_id" value={bag.id} />
                            <input type="hidden" name="hide" value={String(!bag.flagged)} />
                            <Button type="submit" variant="outline" size="xs">
                              {bag.flagged ? "Republish" : "Hide"}
                            </Button>
                          </form>

                          <form action={setBagVerification} className="flex items-center gap-1">
                            <input type="hidden" name="bag_id" value={bag.id} />
                            <NativeSelect
                              name="status"
                              defaultValue={bag.verification_status}
                              className="h-6 w-auto text-xs py-0"
                            >
                              {Constants.public.Enums.verification_status.map((s) => (
                                <option key={s} value={s}>
                                  {VERIFICATION_LABELS[s]}
                                </option>
                              ))}
                            </NativeSelect>
                            <Button type="submit" variant="ghost" size="xs">
                              Set
                            </Button>
                          </form>

                          <details>
                            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-destructive list-none">
                              Delete…
                            </summary>
                            <form action={deleteBag} className="inline">
                              <input type="hidden" name="bag_id" value={bag.id} />
                              <Button type="submit" variant="destructive" size="xs">
                                Confirm delete
                              </Button>
                            </form>
                          </details>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Brand profile (brand admins manage their public roaster page) */}
      {isBrandAdmin && profile?.brands && (
        <section className="space-y-3 border-t pt-6">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Roaster profile
          </h2>
          <p className="text-xs text-muted-foreground">
            Shown on your public page at /roasters/{profile.brands.slug}.
          </p>
          <BrandProfileForm brand={profile.brands} />
        </section>
      )}

      {/* Flagged recipes (moderation) */}
      {isModeration && reportedRecipes.length > 0 && (
        <section className="space-y-3 border-t pt-6">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Reported recipes
          </h2>
          <ul className="divide-y rounded-md border bg-card">
            {reportedRecipes.map((r) => (
              <li key={r.id} className="px-4 py-3 space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm min-w-0">
                    <Link
                      href={`/bags/${r.bag_id}`}
                      className="font-medium underline underline-offset-2"
                    >
                      {r.bags?.brands?.name} — {r.bags?.coffee_name}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {" "}
                      · {BREW_METHOD_LABELS[r.brew_method]} · by{" "}
                      {r.profiles?.display_name ?? "Anonymous"}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    {r.flagged && (
                      <Badge variant="destructive" className="font-mono text-[10px] uppercase">
                        Hidden
                      </Badge>
                    )}
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {r.flag_count} {r.flag_count === 1 ? "report" : "reports"}
                    </span>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <form action={setRecipeHidden}>
                    <input type="hidden" name="recipe_id" value={r.id} />
                    <input type="hidden" name="bag_id" value={r.bag_id} />
                    <input type="hidden" name="hide" value={String(!r.flagged)} />
                    <Button type="submit" variant="outline" size="xs">
                      {r.flagged ? "Republish" : "Hide"}
                    </Button>
                  </form>
                  <details>
                    <summary className="cursor-pointer text-xs text-muted-foreground hover:text-destructive list-none">
                      Delete…
                    </summary>
                    <form action={deleteRecipeAdmin} className="inline">
                      <input type="hidden" name="recipe_id" value={r.id} />
                      <input type="hidden" name="bag_id" value={r.bag_id} />
                      <Button type="submit" variant="destructive" size="xs">
                        Confirm delete
                      </Button>
                    </form>
                  </details>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Claim requests (queue visible to moderation; decisions are superadmin-only) */}
      {isModeration && pendingClaims.length > 0 && (
        <section className="space-y-3 border-t pt-6">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Claim requests
          </h2>
          <ul className="divide-y rounded-md border bg-card">
            {pendingClaims.map((c) => (
              <li key={c.claim_id} className="px-4 py-3 space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-medium">
                    {c.brand_name}
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      claimed by {c.claimant_name ?? "—"} ({c.claimant_email})
                    </span>
                  </span>
                  {c.brand_website && (
                    <a
                      href={c.brand_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground underline underline-offset-2"
                    >
                      {c.brand_website}
                    </a>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{c.message}</p>
                {isSuperadmin ? (
                  <div className="flex gap-2">
                    <form action={resolveBrandClaim}>
                      <input type="hidden" name="claim_id" value={c.claim_id} />
                      <input type="hidden" name="approve" value="true" />
                      <input type="hidden" name="brand_slug" value={c.brand_slug} />
                      <Button type="submit" size="xs">
                        Approve
                      </Button>
                    </form>
                    <form action={resolveBrandClaim}>
                      <input type="hidden" name="claim_id" value={c.claim_id} />
                      <input type="hidden" name="approve" value="false" />
                      <input type="hidden" name="brand_slug" value={c.brand_slug} />
                      <Button type="submit" variant="outline" size="xs">
                        Reject
                      </Button>
                    </form>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Claim decisions are made by the site admin.
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Brand admin management (list for moderation; changes superadmin-only) */}
      {isModeration && (
        <section className="space-y-3 border-t pt-6">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Brand admins
          </h2>
          {(brandAdmins?.data ?? []).length > 0 && (
            <ul className="divide-y rounded-md border bg-card">
              {(brandAdmins?.data ?? []).map((ba) => (
                <li key={ba.email} className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="text-sm min-w-0 truncate">
                    {ba.email}
                    <span className="text-muted-foreground"> → {ba.brand_name ?? "—"}</span>
                  </span>
                  {isSuperadmin && (
                    <form action={revokeBrandAdmin}>
                      <input type="hidden" name="email" value={ba.email} />
                      <Button type="submit" variant="ghost" size="xs">
                        Revoke
                      </Button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
          {isSuperadmin && <AssignBrandAdminForm brands={brands ?? []} />}
        </section>
      )}

      {/* Moderators (superadmin only) */}
      {isSuperadmin && (
        <section className="space-y-3 border-t pt-6">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Moderators
          </h2>
          <p className="text-xs text-muted-foreground">
            Moderators can hide/delete content and ban users, but can&apos;t
            grant roles or decide roaster claims.
          </p>
          {(moderators?.data ?? []).length > 0 && (
            <ul className="divide-y rounded-md border bg-card">
              {(moderators?.data ?? []).map((m) => (
                <li key={m.email} className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="text-sm min-w-0 truncate">
                    {m.email}
                    {m.display_name && (
                      <span className="text-muted-foreground"> · {m.display_name}</span>
                    )}
                  </span>
                  <form action={revokeModerator}>
                    <input type="hidden" name="email" value={m.email} />
                    <Button type="submit" variant="ghost" size="xs">
                      Revoke
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <EmailActionForm
            action={assignModerator}
            buttonLabel="Make moderator"
            pendingLabel="Assigning…"
            successLabel="Moderator assigned."
          />
        </section>
      )}

      {/* Banned users (moderation) */}
      {isModeration && (
        <section className="space-y-3 border-t pt-6">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Banned users
          </h2>
          <p className="text-xs text-muted-foreground">
            Banned users can&apos;t sign in; their existing content stays and
            remains moderatable.
          </p>
          {(banned?.data ?? []).length > 0 && (
            <ul className="divide-y rounded-md border bg-card">
              {(banned?.data ?? []).map((b) => (
                <li key={b.email} className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="text-sm min-w-0 truncate">
                    {b.email}
                    {b.display_name && (
                      <span className="text-muted-foreground"> · {b.display_name}</span>
                    )}
                  </span>
                  <form action={unbanUser}>
                    <input type="hidden" name="email" value={b.email} />
                    <Button type="submit" variant="ghost" size="xs">
                      Unban
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <EmailActionForm
            action={banUser}
            buttonLabel="Ban user"
            pendingLabel="Banning…"
            successLabel="User banned."
          />
        </section>
      )}
    </div>
  )
}
