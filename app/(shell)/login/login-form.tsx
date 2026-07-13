"use client"

import { useActionState } from "react"
import { useSearchParams } from "next/navigation"
import { sendMagicLink } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get("next") ?? "/"
  const linkError = searchParams.get("error")
  const [state, formAction, pending] = useActionState(sendMagicLink, null)

  if (state?.ok) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          We sent you a sign-in link. Open it on this device to continue —
          no password needed.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a magic link. First time
          here? The same link creates your account.
        </p>
      </div>

      {linkError && !state?.error && (
        <p className="text-sm text-destructive">
          That sign-in link was invalid or expired. Request a new one below.
        </p>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Sending…" : "Send magic link"}
        </Button>
      </form>
    </div>
  )
}
