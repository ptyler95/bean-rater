import { z } from "zod"
import { Constants } from "@/lib/database.types"

const emptyToUndef = (v: unknown) => (v === "" || v == null ? undefined : v)

/** Shared client + server validation for recipe submissions. */
export const recipeSchema = z.object({
  brew_method: z.enum(Constants.public.Enums.brew_method),
  dose_g: z.coerce
    .number()
    .positive("Dose is required")
    .max(500, "That's a lot of coffee — max 500 g"),
  yield_g: z.preprocess(
    emptyToUndef,
    z.coerce.number().positive().max(2000).optional()
  ),
  water_ml: z.preprocess(
    emptyToUndef,
    z.coerce.number().positive().max(20000).optional()
  ),
  brew_time_s: z.coerce
    .number()
    .int("Whole seconds only")
    .positive("Brew time is required")
    .max(172800, "Max 48 hours"),
  water_temp_c: z.coerce
    .number()
    .min(0, "Temp in °C")
    .max(100, "Water boils at 100 °C"),
  grind_category: z.enum(Constants.public.Enums.grind_category),
  rating: z.coerce
    .number()
    .int()
    .min(1, "Rate this brew 1–5")
    .max(5),
  notes: z.preprocess(
    emptyToUndef,
    z.string().max(1000, "Keep notes under 1000 characters").optional()
  ),
  freshness_offset: z.preprocess(
    emptyToUndef,
    z.enum(Constants.public.Enums.freshness_offset).optional()
  ),
  grinder_model: z.preprocess(emptyToUndef, z.string().max(120).optional()),
  machine_model: z.preprocess(emptyToUndef, z.string().max(120).optional()),
  burr_type: z.preprocess(emptyToUndef, z.string().max(120).optional()),
})

export type RecipeFormInput = z.input<typeof recipeSchema>
export type RecipeFormValues = z.output<typeof recipeSchema>
