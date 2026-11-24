"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { MarketingPromptCard } from "@/components/marketing-prompt-card"

/**
 * One-time marketing opt-in prompt for signed-in users who haven't answered.
 * Checked client-side so static pages (privacy, terms, about) stay static.
 * Renders nothing for signed-out visitors and for anyone who has answered
 * (yes or no).
 */
export function MarketingPrompt() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function check() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from("profiles")
        .select("marketing_opt_in, marketing_prompt_answered_at")
        .eq("user_id", user.id)
        .maybeSingle()
      if (
        !cancelled &&
        profile &&
        !profile.marketing_opt_in &&
        !profile.marketing_prompt_answered_at
      ) {
        setShow(true)
      }
    }
    check().catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return show ? <MarketingPromptCard /> : null
}
