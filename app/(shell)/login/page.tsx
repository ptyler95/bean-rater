import { Suspense } from "react"
import type { Metadata } from "next"
import { LoginForm } from "./login-form"

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Grounded with a magic link — no password needed.",
}

export default function LoginPage() {
  return (
    <div className="max-w-sm mx-auto pt-16">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
