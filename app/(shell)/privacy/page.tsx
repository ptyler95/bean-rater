export const metadata = { title: "Privacy Policy" }

const EFFECTIVE_DATE = "July 6, 2026"
const CONTACT_EMAIL = "preston@namelessconsulting.com"

export default function PrivacyPage() {
  return (
    <article className="pt-8 max-w-prose space-y-6 text-sm leading-relaxed">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Effective {EFFECTIVE_DATE}
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="font-semibold">What we collect</h2>
        <p>
          <strong>Account data.</strong> When you sign in with a magic link we
          store your email address and a display name derived from it (which
          appears next to your submissions).
        </p>
        <p>
          <strong>Content you submit.</strong> Brew recipes (doses, times,
          temperatures, equipment, notes, ratings), coffee bags and brands you
          add, and flags you raise on listings. Recipes and bags are public and
          attributed to your display name — never your email.
        </p>
        <p>
          <strong>Technical basics.</strong> We use cookies solely to keep you
          signed in. We do not run advertising or cross-site tracking, and we
          do not sell your data.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">How we use it</h2>
        <p>
          To operate the site: showing community recipes, computing aggregate
          &ldquo;community recipe&rdquo; statistics, moderating flagged
          content, and emailing you sign-in links. That&apos;s it.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Who else touches your data</h2>
        <p>
          Grounded runs on Supabase (database and authentication, hosted in
          the United States) and Vercel (web hosting). Sign-in emails are
          delivered through our email provider. These processors store data on
          our behalf and are not permitted to use it for their own purposes.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Deleting your account</h2>
        <p>
          Email us at {CONTACT_EMAIL} and we&apos;ll delete your account and
          email address. Recipes and bags you contributed remain on the site
          but are re-attributed to an anonymous &ldquo;Archive&rdquo; account —
          like edits to a wiki, the community data survives the contributor. If
          you want specific submissions removed as well, say so in your request
          and we&apos;ll take them down.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Changes and contact</h2>
        <p>
          If this policy changes materially we&apos;ll update the effective
          date above. Questions: {CONTACT_EMAIL}.
        </p>
      </section>
    </article>
  )
}
