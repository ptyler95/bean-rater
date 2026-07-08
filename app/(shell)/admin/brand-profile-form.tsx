"use client"

import { useActionState } from "react"
import { updateBrandProfile } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function BrandProfileForm({
  brand,
}: {
  brand: {
    id: string
    slug: string
    description: string | null
    website: string | null
    logo_url: string | null
  }
}) {
  const [state, formAction, pending] = useActionState(updateBrandProfile, null)

  return (
    <form action={formAction} className="space-y-3 max-w-lg">
      <input type="hidden" name="brand_id" value={brand.id} />
      <input type="hidden" name="brand_slug" value={brand.slug} />
      <div className="space-y-1.5">
        <Label htmlFor="brand-description">Description</Label>
        <Textarea
          id="brand-description"
          name="description"
          rows={3}
          maxLength={600}
          defaultValue={brand.description ?? ""}
          placeholder="A sentence or two about the roastery, shown on your public page."
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="brand-website">Website</Label>
        <Input
          id="brand-website"
          name="website"
          type="url"
          defaultValue={brand.website ?? ""}
          placeholder="https://…"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="brand-logo">Logo URL</Label>
        <Input
          id="brand-logo"
          name="logo_url"
          type="url"
          defaultValue={brand.logo_url ?? ""}
          placeholder="https://… (square image works best)"
        />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
      {state?.ok && <p className="text-xs text-muted-foreground">Saved.</p>}
    </form>
  )
}
