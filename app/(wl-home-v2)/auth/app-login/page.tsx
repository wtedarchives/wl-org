"use client"

// app/(wl-home-v2)/auth/app-login/page.tsx
//
// Native-app SSO entry point.
//
// The iOS app opens this route in its login web view. We start the normal
// DiscourseConnect SSO flow with `appMode`, which returns through
// /auth/app-callback — a route that always hands the minted JWT back to the app
// via the `wtedradio://` scheme. No new secrets involved.
//
// The legacy `sso_app_mode` sessionStorage flag is still set so app builds that
// somehow land on /auth/callback instead keep working. Don't rely on it: it's
// per-origin, so it vanishes if sign-in starts on a different host than the one
// Discourse returns to (that's what broke app login at the wtedradio.com
// cutover, and why app mode now lives in the return path).

import { useEffect } from "react"
import { redirectToLogin } from "@/lib/sso"

export default function AppLoginPage() {
  useEffect(() => {
    try {
      sessionStorage.setItem("sso_app_mode", "1")
    } catch {
      // sessionStorage unavailable — /auth/app-callback doesn't need it.
    }
    void redirectToLogin("/", { appMode: true })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Opening sign in…</p>
      </div>
    </div>
  )
}
