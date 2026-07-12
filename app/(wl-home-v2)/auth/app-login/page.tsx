"use client"

// app/(wl-home-v2)/auth/app-login/page.tsx
//
// Native-app SSO entry point.
//
// The iOS app opens this route inside an ASWebAuthenticationSession. We flag
// "app mode" in sessionStorage so the shared /auth/callback hands the minted
// JWT back to the app via the `wtedradio://` scheme (see auth/callback/page.tsx),
// then kick off the normal DiscourseConnect SSO flow. No new secrets involved.

import { useEffect } from "react"
import { redirectToLogin } from "@/lib/sso"

export default function AppLoginPage() {
  useEffect(() => {
    try {
      sessionStorage.setItem("sso_app_mode", "1")
    } catch {
      // sessionStorage unavailable — the callback simply falls back to web behavior.
    }
    void redirectToLogin("/")
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
