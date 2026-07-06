import type { Enums } from "@/lib/database.types"

export const BREW_METHOD_LABELS: Record<Enums<"brew_method">, string> = {
  espresso: "Espresso",
  pour_over: "Pour Over",
  aeropress: "AeroPress",
  french_press: "French Press",
  moka_pot: "Moka Pot",
  cold_brew: "Cold Brew",
  batch: "Batch Brew",
}

export const ROAST_LEVEL_LABELS: Record<Enums<"roast_level">, string> = {
  light: "Light",
  medium_light: "Medium-Light",
  medium: "Medium",
  medium_dark: "Medium-Dark",
  dark: "Dark",
}

export const PROCESS_LABELS: Record<Enums<"process_method">, string> = {
  washed: "Washed",
  natural: "Natural",
  honey: "Honey",
  anaerobic: "Anaerobic",
  other: "Other",
}

export const GRIND_LABELS: Record<Enums<"grind_category">, string> = {
  extra_fine: "Extra Fine",
  fine: "Fine",
  medium_fine: "Medium-Fine",
  medium: "Medium",
  medium_coarse: "Medium-Coarse",
  coarse: "Coarse",
  extra_coarse: "Extra Coarse",
}

export const FRESHNESS_LABELS: Record<Enums<"freshness_offset">, string> = {
  under_7: "< 7 days off roast",
  "7_to_14": "7–14 days off roast",
  "14_to_21": "14–21 days off roast",
  over_21: "> 21 days off roast",
}

export const VERIFICATION_LABELS: Record<Enums<"verification_status">, string> = {
  unverified: "Unverified",
  community_verified: "Community Verified",
  roaster_verified: "Roaster Verified",
}
