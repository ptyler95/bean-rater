import { z } from "zod"
import { Constants } from "@/lib/database.types"

const emptyToUndef = (v: unknown) => (v === "" || v == null ? undefined : v)

/** Shared client + server validation for adding a bag. */
export const bagSchema = z.object({
  brand_name: z
    .string()
    .trim()
    .min(2, "Brand name is required (2+ characters)")
    .max(80, "Max 80 characters"),
  coffee_name: z
    .string()
    .trim()
    .min(2, "Coffee name is required (2+ characters)")
    .max(120, "Max 120 characters"),
  origin: z
    .string()
    .trim()
    .min(2, "Origin is required — country or “Blend”")
    .max(80, "Max 80 characters"),
  region: z.preprocess(emptyToUndef, z.string().trim().max(80).optional()),
  roast_level: z.enum(Constants.public.Enums.roast_level),
  process: z.enum(Constants.public.Enums.process_method),
  bag_size: z.preprocess(emptyToUndef, z.string().trim().max(40).optional()),
  varietal: z.preprocess(emptyToUndef, z.string().trim().max(120).optional()),
  altitude_masl: z.preprocess(
    emptyToUndef,
    z.coerce
      .number()
      .int("Whole meters")
      .min(0)
      .max(5000, "Above 5000 masl nothing grows")
      .optional()
  ),
  product_url: z.preprocess(
    emptyToUndef,
    z
      .url({
        protocol: /^https?$/,
        error: "Must be a full web URL (https://…)",
      })
      .max(300)
      .optional()
  ),
})

/** Bag editing (admin / brand admin): brand is fixed; verification editable. */
export const bagEditSchema = bagSchema
  .omit({ brand_name: true })
  .extend({
    verification_status: z.enum(Constants.public.Enums.verification_status),
  })

export type BagEditInput = z.input<typeof bagEditSchema>
export type BagEditValues = z.output<typeof bagEditSchema>

export type BagFormInput = z.input<typeof bagSchema>
export type BagFormValues = z.output<typeof bagSchema>
