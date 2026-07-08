export const metadata = { title: "Terms of Service" }

const EFFECTIVE_DATE = "July 6, 2026"
const CONTACT_EMAIL = "preston@namelessconsulting.com"

export default function TermsPage() {
  return (
    <article className="pt-8 max-w-prose space-y-6 text-sm leading-relaxed">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Effective {EFFECTIVE_DATE}
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="font-semibold">The service</h2>
        <p>
          Grounded is a community database of coffee brewing recipes tied to
          specific bags of coffee. Recipes and aggregate statistics are
          community-submitted opinions about taste — not professional advice,
          and not guaranteed to be accurate or safe for your equipment.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Your account and content</h2>
        <p>
          You&apos;re responsible for activity under your account. By
          submitting recipes, bags, brands, or notes, you grant Grounded a
          perpetual, worldwide, royalty-free license to display, aggregate, and
          adapt that content as part of the service (including in
          &ldquo;community recipe&rdquo; statistics). Submit only content you
          have the right to share.
        </p>
        <p>
          Don&apos;t post spam, misleading listings, advertising disguised as
          data, content you don&apos;t own, or anything unlawful. Don&apos;t
          use automation to scrape at abusive rates, farm accounts, or
          manipulate ratings, flags, or consensus statistics.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Moderation</h2>
        <p>
          Community flags can hide listings automatically, and moderators may
          edit, hide, verify, or remove any content or account at their
          discretion to keep the data trustworthy. Brand representatives with
          verified access may manage listings for their own brand.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Disclaimers</h2>
        <p>
          The service is provided &ldquo;as is&rdquo; without warranties of any
          kind. To the maximum extent permitted by law, Grounded is not
          liable for indirect or consequential damages arising from use of the
          service, and total liability is limited to the amount you paid us
          (currently: nothing).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Changes and contact</h2>
        <p>
          We may update these terms; continued use after an update is
          acceptance. Material changes will move the effective date above.
          Questions: {CONTACT_EMAIL}.
        </p>
      </section>
    </article>
  )
}
