"use client"

// app/(wl-home-v2)/tv-login/page.tsx
//
// Apple TV device-pairing sign-in (phone side).
//
// The TV shows a QR encoding /tv-login?code=<user_code>. This page:
//   1. If already signed in (valid wl_session) → bind immediately.
//   2. Otherwise stash the code and run the normal DiscourseConnect SSO with
//      returnTo=/tv-login. SSO returns through the shared /auth/callback, which
//      stores the JWT and redirects back here.
//   3. On return (token present + stashed code) → call tv-pair-bind to attach
//      the token to the pairing. The TV picks it up on its next poll.
//
// No changes to /auth/callback or lib/sso are required. Also serves as the
// universal-link target so the iOS app can intercept and bind with its own token.

import { useEffect, useState } from "react"
import { getSession } from "@/lib/jwt"
import { redirectToLogin } from "@/lib/sso"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const BIND_FUNCTION = `${SUPABASE_URL}/functions/v1/tv-pair-bind`
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const CODE_KEY = "tv_pair_code"

type Status = "working" | "success" | "error"

export default function TvLoginPage() {
  const [status, setStatus] = useState<Status>("working")
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function bind(userCode: string, token: string) {
      try {
        const res = await fetch(BIND_FUNCTION, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "x-wysteria-authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ user_code: userCode }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data?.success) {
          throw new Error(data?.error ?? "Sign-in couldn't be completed.")
        }
        try { sessionStorage.removeItem(CODE_KEY) } catch { /* ignore */ }
        setStatus("success")
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Something went wrong.")
        setStatus("error")
      }
    }

    const urlCode = new URLSearchParams(window.location.search).get("code")
    const storedCode = (() => {
      try { return sessionStorage.getItem(CODE_KEY) } catch { return null }
    })()
    const code = urlCode ?? storedCode
    const session = getSession()

    // Already authenticated (fresh open while logged in, or returning from SSO).
    if (code && session?.token) {
      void bind(code, session.token)
      return
    }

    // Fresh open, not signed in → stash the code and start SSO back to here.
    if (urlCode) {
      try { sessionStorage.setItem(CODE_KEY, urlCode) } catch { /* ignore */ }
      void redirectToLogin("/tv-login")
      return
    }

    setMessage("Missing pairing code. Reopen the code shown on your TV.")
    setStatus("error")
  }, [])

  // ─── UI ─────────────────────────────────────────────────────────────────────

  if (status === "success") {
    return (
      <Centered>
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-foreground mb-2">You&apos;re signed in on your TV</h1>
        <p className="text-sm text-muted-foreground">You can close this window and return to WTED Goose Radio on Apple TV.</p>
      </Centered>
    )
  }

  if (status === "error") {
    return (
      <Centered>
        <h1 className="text-lg font-semibold text-foreground mb-2">Couldn&apos;t sign in</h1>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        <a href="/" className="text-sm font-medium text-primary hover:underline">Back to home</a>
      </Centered>
    )
  }

  return (
    <Centered>
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </Centered>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-sm px-6">{children}</div>
    </div>
  )
}
