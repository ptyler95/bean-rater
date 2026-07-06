"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { updateBag } from "./actions"
import {
  bagEditSchema,
  type BagEditInput,
  type BagEditValues,
} from "@/lib/bag-schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import {
  PROCESS_LABELS,
  ROAST_LEVEL_LABELS,
  VERIFICATION_LABELS,
} from "@/lib/labels"
import { Constants, type Tables } from "@/lib/database.types"

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive">{message}</p>
}

export function BagEditForm({
  bag,
  allowedVerification,
}: {
  bag: Tables<"bags">
  /** admins pick any status; brand admins only unverified/roaster_verified */
  allowedVerification: readonly Tables<"bags">["verification_status"][]
}) {
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BagEditInput, unknown, BagEditValues>({
    resolver: zodResolver(bagEditSchema),
    defaultValues: {
      coffee_name: bag.coffee_name,
      origin: bag.origin,
      region: bag.region ?? "",
      roast_level: bag.roast_level,
      process: bag.process,
      bag_size: bag.bag_size ?? "",
      varietal: bag.varietal ?? "",
      altitude_masl: bag.altitude_masl ?? ("" as unknown as number),
      product_url: bag.product_url ?? "",
      verification_status: bag.verification_status,
    },
  })

  async function onSubmit(values: BagEditValues) {
    setServerError(null)
    const result = await updateBag(bag.id, values)
    if (result?.error) setServerError(result.error)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="coffee_name">Coffee name</Label>
        <Input id="coffee_name" aria-invalid={!!errors.coffee_name} {...register("coffee_name")} />
        <FieldError message={errors.coffee_name?.message} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="origin">Origin</Label>
          <Input id="origin" aria-invalid={!!errors.origin} {...register("origin")} />
          <FieldError message={errors.origin?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="region">Region</Label>
          <Input id="region" {...register("region")} />
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
        <div className="space-y-2">
          <Label htmlFor="bag_size">Bag size</Label>
          <Input id="bag_size" {...register("bag_size")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="altitude_masl">Altitude (masl)</Label>
          <Input
            id="altitude_masl"
            type="number"
            inputMode="numeric"
            aria-invalid={!!errors.altitude_masl}
            {...register("altitude_masl")}
          />
          <FieldError message={errors.altitude_masl?.message} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="varietal">Varietal</Label>
        <Input id="varietal" {...register("varietal")} />
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

      <div className="space-y-2">
        <Label htmlFor="verification_status">Verification</Label>
        <NativeSelect id="verification_status" {...register("verification_status")}>
          {allowedVerification.map((s) => (
            <option key={s} value={s}>
              {VERIFICATION_LABELS[s]}
            </option>
          ))}
        </NativeSelect>
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Saving…" : "Save changes"}
      </Button>
    </form>
  )
}
