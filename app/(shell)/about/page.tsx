import Link from "next/link"
import type { Metadata } from "next"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "About",
  description:
    "Grounded exists to shrink the effort of dialing in a new bag of coffee — one place for the brew recipes that live scattered across the internet or in a barista's head.",
}

export default function AboutPage() {
  return (
    <article className="pt-12 pb-8 space-y-12">
      <header className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          About Grounded
        </p>
        <h1 className="font-heading text-4xl leading-tight tracking-tight sm:text-5xl">
          Less dialing in.
          <br />
          More drinking coffee.
        </h1>
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground sm:text-base">
          Every new bag of coffee comes with a tax: the doses you sink, the
          shots you pull, the mornings you spend troubleshooting instead of
          enjoying. Grounded exists to shrink that tax. It&apos;s a
          community catalog of brew recipes tied to specific bags — so when
          you crack a new one, you can start from numbers someone has already
          worked out instead of from scratch.
        </p>
      </header>

      <section className="space-y-3 border-t pt-8">
        <h2 className="font-heading text-2xl tracking-tight">
          Why it started
        </h2>
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
          Grounded began with espresso. If you like trying new bags, you
          know the ritual — a fresh coffee in the hopper means burning through
          doses hunting for a grind, a ratio, and a time that tastes like what
          the roaster promised. Espresso is the least forgiving way to find
          out you guessed wrong, and it&apos;s where a good starting recipe
          saves the most beans. So we started logging what actually worked,
          bag by bag.
        </p>
      </section>

      <section className="space-y-3 border-t pt-8">
        <h2 className="font-heading text-2xl tracking-tight">
          Where it&apos;s going
        </h2>
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
          The bigger problem isn&apos;t just espresso — it&apos;s that brew
          recipes have no home. Right now they live in Reddit threads, roaster
          product pages, forum posts, group chats, and in the head of the
          barista who dialed in your bag this morning. Grounded is meant to
          be the central place that knowledge lands: one page per bag, every
          method, real doses, temps, and times from people who brewed it.
          When enough recipes accumulate, they form a community consensus —
          the starting point the next person wishes they had.
        </p>
      </section>

      <section className="space-y-4 border-t pt-8">
        <h2 className="font-heading text-2xl tracking-tight">
          Help build the catalog
        </h2>
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
          Every recipe you log saves someone else a morning of trial and
          error. Find your bag, steal a recipe, and leave your own notes for
          the next person.
        </p>
        <Button nativeButton={false} render={<Link href="/bags" />}>
          Browse bags &amp; recipes →
        </Button>
      </section>
    </article>
  )
}
