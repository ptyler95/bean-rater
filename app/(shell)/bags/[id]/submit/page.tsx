import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { RecipeForm } from "./recipe-form"
import { Constants, type Enums } from "@/lib/database.types"
import { PROCESS_LABELS, ROAST_LEVEL_LABELS } from "@/lib/labels"

export default async function SubmitRecipePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ method?: string }>
}) {
  const [{ id }, { method }] = await Promise.all([params, searchParams])
  const supabase = await createClient()

  const { data: bag } = await supabase
    .from("bags")
    .select("id, coffee_name, origin, roast_level, process, brands(name)")
    .eq("id", id)
    .maybeSingle()

  if (!bag) notFound()

  const defaultMethod = (
    Constants.public.Enums.brew_method as readonly string[]
  ).includes(method ?? "")
    ? (method as Enums<"brew_method">)
    : undefined

  return (
    <div className="pt-8 max-w-md mx-auto space-y-6">
      <header className="space-y-1">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Log a recipe for
        </p>
        <h1 className="text-xl font-semibold tracking-tight">
          {bag.brands?.name} — {bag.coffee_name}
        </h1>
        <p className="text-xs text-muted-foreground">
          {bag.origin} · {ROAST_LEVEL_LABELS[bag.roast_level]} ·{" "}
          {PROCESS_LABELS[bag.process]}
        </p>
      </header>

      <RecipeForm bagId={bag.id} defaultMethod={defaultMethod} />
    </div>
  )
}
