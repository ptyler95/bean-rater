"use client"

import { useActionState } from "react"
import { assignBrandAdmin } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"

export function AssignBrandAdminForm({
  brands,
}: {
  brands: { name: string; slug: string }[]
}) {
  const [state, formAction, pending] = useActionState(assignBrandAdmin, null)

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <Input
        name="email"
        type="email"
        required
        placeholder="user@example.com"
        className="w-56"
        aria-label="User email"
      />
      <NativeSelect name="brand_slug" required className="w-auto" aria-label="Brand">
        <option value="">Pick brand…</option>
        {brands.map((b) => (
          <option key={b.slug} value={b.slug}>
            {b.name}
          </option>
        ))}
      </NativeSelect>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Assigning…" : "Assign"}
      </Button>
      {state?.error && <p className="text-xs text-destructive w-full">{state.error}</p>}
      {state?.ok && <p className="text-xs text-muted-foreground w-full">Assigned.</p>}
    </form>
  )
}
