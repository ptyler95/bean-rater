import { createClient } from "@/lib/supabase/server"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const metadata = { title: "Admin — flagged bags" }

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null }

  if (profile?.role !== "admin") {
    return (
      <div className="pt-16 text-center space-y-2">
        <h1 className="text-lg font-semibold">Admin only</h1>
        <p className="text-sm text-muted-foreground">
          Your account doesn&apos;t have the admin role.
        </p>
      </div>
    )
  }

  // RLS: admins can read flagged bags; everyone else can't.
  const { data: flaggedBags } = await supabase
    .from("bags")
    .select("id, coffee_name, origin, flag_count, created_at, brands(name)")
    .eq("flagged", true)
    .order("flag_count", { ascending: false })

  return (
    <div className="pt-8 space-y-4">
      <h1 className="text-lg font-semibold">Flagged bags</h1>
      {(flaggedBags ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Queue is empty — nothing flagged right now.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bag</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Origin</TableHead>
              <TableHead className="text-right">Flags</TableHead>
              <TableHead className="text-right">Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(flaggedBags ?? []).map((bag) => (
              <TableRow key={bag.id}>
                <TableCell className="font-medium">
                  <a href={`/bags/${bag.id}`} className="underline underline-offset-2">
                    {bag.coffee_name}
                  </a>
                </TableCell>
                <TableCell>{bag.brands?.name}</TableCell>
                <TableCell>{bag.origin}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {bag.flag_count}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {new Date(bag.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
