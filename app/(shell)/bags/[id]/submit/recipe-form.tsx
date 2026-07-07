"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { submitRecipe } from "./actions"
import {
  recipeSchema,
  type RecipeFormInput,
  type RecipeFormValues,
} from "@/lib/recipe-schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { NativeSelect } from "@/components/ui/native-select"
import {
  BREW_METHOD_LABELS,
  FRESHNESS_LABELS,
  GRIND_LABELS,
} from "@/lib/labels"
import { Constants, type Enums } from "@/lib/database.types"
import { cn } from "@/lib/utils"

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

export function RecipeForm({
  bagId,
  defaultMethod,
}: {
  bagId: string
  defaultMethod?: Enums<"brew_method">
}) {
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RecipeFormInput, unknown, RecipeFormValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      brew_method: defaultMethod ?? "pour_over",
      grind_category: "medium",
    },
  })

  const rating = Number(watch("rating") ?? 0)

  async function onSubmit(values: RecipeFormValues) {
    setServerError(null)
    const result = await submitRecipe(bagId, values)
    if (result?.error) setServerError(result.error)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Method */}
      <section className="space-y-4">
        <SectionHeading>Brew method</SectionHeading>
        <div className="space-y-2">
          <Label htmlFor="brew_method">Method</Label>
          <NativeSelect id="brew_method" {...register("brew_method")}>
            {Constants.public.Enums.brew_method.map((m) => (
              <option key={m} value={m}>
                {BREW_METHOD_LABELS[m]}
              </option>
            ))}
          </NativeSelect>
        </div>
      </section>

      {/* Measurements */}
      <section className="space-y-4">
        <SectionHeading>Measurements</SectionHeading>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dose_g">Dose (g)</Label>
            <Input
              id="dose_g"
              type="number"
              step="0.1"
              inputMode="decimal"
              placeholder="18"
              aria-invalid={!!errors.dose_g}
              {...register("dose_g")}
            />
            <FieldError message={errors.dose_g?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="yield_g">Yield (g, optional)</Label>
            <Input
              id="yield_g"
              type="number"
              step="0.1"
              inputMode="decimal"
              placeholder="36"
              aria-invalid={!!errors.yield_g}
              {...register("yield_g")}
            />
            <FieldError message={errors.yield_g?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="water_ml">Water (ml, optional)</Label>
            <Input
              id="water_ml"
              type="number"
              step="1"
              inputMode="decimal"
              placeholder="250"
              aria-invalid={!!errors.water_ml}
              {...register("water_ml")}
            />
            <FieldError message={errors.water_ml?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brew_time_s">Brew time (seconds)</Label>
            <Input
              id="brew_time_s"
              type="number"
              step="1"
              inputMode="numeric"
              placeholder="165"
              aria-invalid={!!errors.brew_time_s}
              {...register("brew_time_s")}
            />
            <FieldError message={errors.brew_time_s?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="water_temp_c">Water temp (°C)</Label>
            <Input
              id="water_temp_c"
              type="number"
              step="0.5"
              inputMode="decimal"
              placeholder="94"
              aria-invalid={!!errors.water_temp_c}
              {...register("water_temp_c")}
            />
            <FieldError message={errors.water_temp_c?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="grind_category">Grind</Label>
            <NativeSelect id="grind_category" {...register("grind_category")}>
              {Constants.public.Enums.grind_category.map((g) => (
                <option key={g} value={g}>
                  {GRIND_LABELS[g]}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
      </section>

      {/* Setup */}
      <section className="space-y-4">
        <SectionHeading>Setup (optional)</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="grinder_model">Grinder</Label>
            <Input
              id="grinder_model"
              placeholder="Comandante C40"
              {...register("grinder_model")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="machine_model">Brewer / machine</Label>
            <Input
              id="machine_model"
              placeholder="Hario V60 02"
              {...register("machine_model")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="burr_type">Burr type</Label>
            <Input
              id="burr_type"
              placeholder="conical"
              {...register("burr_type")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="freshness_offset">Beans off roast</Label>
            <NativeSelect id="freshness_offset" {...register("freshness_offset")}>
              <option value="">Not sure</option>
              {Constants.public.Enums.freshness_offset.map((f) => (
                <option key={f} value={f}>
                  {FRESHNESS_LABELS[f]}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
      </section>

      {/* Rating & notes */}
      <section className="space-y-4">
        <SectionHeading>Rating &amp; notes</SectionHeading>
        <div className="space-y-2">
          <Label>How was the cup?</Label>
          <div
            role="radiogroup"
            aria-label="Rating from 1 to 5"
            className="flex items-center gap-2"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} out of 5`}
                onClick={() =>
                  setValue("rating", n, { shouldValidate: true })
                }
                className={cn(
                  "size-8 rounded-full border-2 transition-colors",
                  n <= rating
                    ? "bg-primary border-primary"
                    : "bg-transparent border-border hover:border-primary/50"
                )}
              />
            ))}
            {rating > 0 && (
              <span className="font-mono text-sm tabular-nums text-muted-foreground ml-1">
                {rating}/5
              </span>
            )}
          </div>
          <input type="hidden" {...register("rating")} />
          <FieldError message={errors.rating?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            rows={4}
            placeholder="What did you taste? What would you change next time?"
            {...register("notes")}
          />
          <FieldError message={errors.notes?.message} />
        </div>
      </section>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Submitting…" : "Submit recipe"}
      </Button>
    </form>
  )
}
