"use client"

// app/(wl-home-v2)/auth/callback/page.tsx
//
// WYSTERIA LANE — SSO Callback Route
// This page receives the user back from WLC after authentication.
//
// Flow:
//   1. WLC redirects here with ?sso=...&sig=... in the URL
//   2. We verify the nonce matches what we stored before redirecting to WLC
//   3. We call the sso-callback Edge Function with sso + sig
//   4. Edge Function validates, resolves profile, issues JWT
//   5. We store the JWT in localStorage
//   6. We redirect to the intended destination (or home)

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { storeToken } from "@/lib/jwt"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SSO_CALLBACK_FUNCTION = `${SUPABASE_URL}/functions/v1/sso-callback`
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

type CallbackStatus = "loading" | "success" | "error"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<CallbackStatus>("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    async function handleCallback() {
      try {
        // Read sso and sig from the URL
        const params = new URLSearchParams(window.location.search)
        const sso = params.get("sso")
        const sig = params.get("sig")

        if (!sso || !sig) {
          setErrorMessage("Missing SSO parameters. Please try signing in again.")
          setStatus("error")
          return
        }

        // Verify the nonce to prevent CSRF attacks
        const storedNonce = sessionStorage.getItem("sso_nonce")
        if (storedNonce) {
          const decodedPayload = atob(sso)
          const payloadParams = new URLSearchParams(decodedPayload)
          const returnedNonce = payloadParams.get("nonce")

          if (returnedNonce !== storedNonce) {
            setErrorMessage("Session mismatch. Please try signing in again.")
            setStatus("error")
            return
          }
        }

        // Call the Edge Function
        const response = await fetch(SSO_CALLBACK_FUNCTION, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ sso, sig }),
        })

        const data = await response.json()

        if (!response.ok || !data.token) {
          console.error("SSO callback error:", data)
          setErrorMessage("Authentication failed. Please try signing in again.")
          setStatus("error")
          return
        }

        // Store the JWT
        storeToken(data.token)
        setStatus("success")

        // Clear SSO sessionStorage items
        sessionStorage.removeItem("sso_nonce")
        const returnTo = sessionStorage.getItem("sso_return_to") ?? "/"
        sessionStorage.removeItem("sso_return_to")

        // Redirect to intended destination
        router.replace(returnTo)
      } catch (err) {
        console.error("Callback error:", err)
        setErrorMessage("Something went wrong. Please try signing in again.")
        setStatus("error")
      }
    }

    handleCallback()
  }, [router])

  // ─── UI ─────────────────────────────────────────────────────────────────────

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-sm px-6">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-5 h-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-2">Sign in failed</h1>
          <p className="text-sm text-muted-foreground mb-6">{errorMessage}</p>
          <a
            href="/"
            className="text-sm font-medium text-primary hover:underline"
          >
            Back to home
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  )
}