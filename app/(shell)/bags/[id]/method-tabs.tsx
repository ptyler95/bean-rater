"use client"

import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ConsensusCard, type ConsensusRow } from "@/components/consensus-card"
import { RecipeCard, type RecipeWithAuthor } from "@/components/recipe-card"
import { BREW_METHOD_LABELS } from "@/lib/labels"
import type { Enums } from "@/lib/database.types"

const CONSENSUS_THRESHOLD = 3

export function MethodTabs({
  bagId,
  recipes,
  consensus,
}: {
  bagId: string
  recipes: RecipeWithAuthor[]
  consensus: ConsensusRow[]
}) {
  // Tabs only for methods that have at least one recipe, busiest first.
  const methods = [...consensus].sort(
    (a, b) => Number(b.recipe_count) - Number(a.recipe_count)
  )

  if (methods.length === 0) {
    return (
      <div className="rounded-md border border-dashed bg-card px-6 py-12 text-center space-y-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          No recipes yet
        </p>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Nobody has dialed in this bag yet. Brewed it? Be the first to log a
          recipe and get the community started.
        </p>
        <Button nativeButton={false} render={<Link href={`/bags/${bagId}/submit`} />}>
          Submit the first recipe
        </Button>
      </div>
    )
  }

  return (
    <Tabs defaultValue={methods[0].brew_method}>
      <TabsList className="w-full h-auto flex-wrap justify-start">
        {methods.map((m) => (
          <TabsTrigger
            key={m.brew_method}
            value={m.brew_method}
            className="font-mono text-xs"
          >
            {BREW_METHOD_LABELS[m.brew_method]}
            <span className="ml-1 text-muted-foreground tabular-nums">
              {m.recipe_count}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      {methods.map((m) => {
        const methodRecipes = recipes
          .filter((r) => r.brew_method === m.brew_method)
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
        const hasConsensus = Number(m.recipe_count) >= CONSENSUS_THRESHOLD

        return (
          <TabsContent
            key={m.brew_method}
            value={m.brew_method}
            className="space-y-4 pt-2"
          >
            {hasConsensus ? (
              <ConsensusCard consensus={m} />
            ) : (
              <p className="text-xs text-muted-foreground">
                {CONSENSUS_THRESHOLD - Number(m.recipe_count)} more{" "}
                {Number(m.recipe_count) === 2 ? "submission" : "submissions"}{" "}
                until a community recipe forms for{" "}
                {BREW_METHOD_LABELS[m.brew_method]}.
              </p>
            )}

            <div className="space-y-3">
              <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {hasConsensus ? "All submissions" : "Submissions (newest first)"}
              </h3>
              {methodRecipes.map((r) => (
                <RecipeCard key={r.id} recipe={r} />
              ))}
            </div>
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
