"use client"

import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createClient } from "@/lib/supabase/client"
import { createBag } from "./actions"
import {
  bagSchema,
  type BagFormInput,
  type BagFormValues,
} from "@/lib/bag-schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { PROCESS_LABELS, ROAST_LEVEL_LABELS } from "@/lib/labels"
import { Constants } from "@/lib/database.types"

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground border-b pb-2">
      {children}
    </h2>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive">{message}</p>
}

export function BagForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BagFormInput, unknown, BagFormValues>({
    resolver: zodResolver(bagSchema),
    defaultValues: { roast_level: "light", process: "washed" },
  })

  // Brand autocomplete: suggest existing brands so entries converge on one
  // spelling; free text still works and find-or-create handles the rest.
  const brandName = watch("brand_name") ?? ""
  const [suggestions, setSuggestions] = useState<{ id: string; name: string }[]>([])
  const [suggestOpen, setSuggestOpen] = useState(false)
  const pickedRef = useRef(false)

  useEffect(() => {
    if (pickedRef.current) {
      pickedRef.current = false
      return
    }
    const q = brandName.trim()
    if (q.length < 2) {
      setSuggestions([])
      setSuggestOpen(false)
      return
    }
    const timer = setTimeout(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("brands")
        .select("id, name")
        .ilike("name", `%${q}%`)
        .order("name")
        .limit(6)
      setSuggestions(data ?? [])
      setSuggestOpen((data ?? []).length > 0)
    }, 200)
    return () => clearTimeout(timer)
  }, [brandName])

  async function onSubmit(values: BagFormValues) {
    setServerError(null)
    const result = await createBag(values)
    if (result?.error) setServerError(result.error)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Brand */}
      <section className="space-y-4">
        <SectionHeading>Roaster</SectionHeading>
        <div className="space-y-2 relative">
          <Label htmlFor="brand_name">Brand</Label>
          <Input
            id="brand_name"
            placeholder="e.g. Cascade Roasting Co."
            autoComplete="off"
            aria-invalid={!!errors.brand_name}
            {...register("brand_name")}
            onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
          />
          {suggestOpen && (
            <ul className="absolute z-20 top-full mt-1 inset-x-0 rounded-md border bg-popover shadow-md overflow-hidden">
              {suggestions.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                    onMouseDown={() => {
                      pickedRef.current = true
                      setValue("brand_name", b.name, { shouldValidate: true })
                      setSuggestOpen(false)
                    }}
                  >
                    {b.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">
            Pick an existing roaster if it appears — new names create a new
            brand entry.
          </p>
          <FieldError message={errors.brand_name?.message} />
        </div>
      </section>

      {/* Identity */}
      <section className="space-y-4">
        <SectionHeading>Coffee</SectionHeading>
        <div className="space-y-2">
          <Label htmlFor="coffee_name">Coffee name</Label>
          <Input
            id="coffee_name"
            placeholder="As printed on the bag, e.g. Yirgacheffe Kochere"
            aria-invalid={!!errors.coffee_name}
            {...register("coffee_name")}
          />
          <FieldError message={errors.coffee_name?.message} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="origin">Origin</Label>
            <Input
              id="origin"
              placeholder="Ethiopia, or “Blend”"
              aria-invalid={!!errors.origin}
              {...register("origin")}
            />
            <FieldError message={errors.origin?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="region">Region (optional)</Label>
            <Input id="region" placeholder="Yirgacheffe" {...register("region")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="roast_level">Roast level</Label>
            <NativeSelect id="roast_level" {...register("roast_level")}>
              {Constants.public.Enums.roast_level.map((r) => (
                <option key={r} value={r}>
                  {ROAST_LEVEL_LABELS[r]}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="process">Process</Label>
            <NativeSelect id="process" {...register("process")}>
              {Constants.public.Enums.process_method.map((p) => (
                <option key={p} value={p}>
                  {PROCESS_LABELS[p]}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="space-y-4">
        <SectionHeading>Details (optional)</SectionHeading>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bag_size">Bag size</Label>
            <Input id="bag_size" placeholder="250g" {...register("bag_size")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="altitude_masl">Altitude (masl)</Label>
            <Input
              id="altitude_masl"
              type="number"
              inputMode="numeric"
              placeholder="1950"
              aria-invalid={!!errors.altitude_masl}
              {...register("altitude_masl")}
            />
            <FieldError message={errors.altitude_masl?.message} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="varietal">Varietal</Label>
          <Input
            id="varietal"
            placeholder="Heirloom / SL28, SL34 / Gesha…"
            {...register("varietal")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product_url">Roaster product page</Label>
          <Input
            id="product_url"
            type="url"
            placeholder="https://…"
            aria-invalid={!!errors.product_url}
            {...register("product_url")}
          />
          <FieldError message={errors.product_url?.message} />
        </div>
      </section>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Adding…" : "Add bag"}
      </Button>
    </form>
  )
}
