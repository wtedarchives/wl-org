"use client"

// app/(wl-home-v2)/auth/app-callback/page.tsx
//
// WYSTERIA LANE — SSO callback for the native apps.
//
// Identical to /auth/callback except this route ALWAYS hands the session back
// to the app over the `wtedradio://` scheme — success or failure — and never
// navigates into the website. The iOS login web view watches for that scheme,
// captures the token, and closes its sheet.
//
// Why a separate route: app mode used to be a `sessionStorage` flag set by
// /auth/app-login. sessionStorage is per-origin, so when the app started on one
// host and Discourse returned to another (the wtedradio.com cutover), the flag
// was gone, the wtedradio:// redirect never fired, and the app's login sheet sat
// on the website forever. A path can't be lost the way a flag can.
//
// The JWT is still stored in localStorage so the website/forum session matches
// the app's, and so the app has a fallback way to read it.

import { useEffect, useState } from "react"
import { storeToken } from "@/lib/jwt"
import { decodeSsoPayload, isSsoFailedPayload } from "@/lib/sso"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SSO_CALLBACK_FUNCTION = `${SUPABASE_URL}/functions/v1/sso-callback`
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/** The app's callback scheme — matches AuthConfig.callbackScheme in the iOS app. */
const APP_CALLBACK = "wtedradio://auth/callback"

export default function AuthAppCallbackPage() {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    /** Hand off to the app and stop. `reason` is for humans, not the app. */
    function handOff(query: string, reason: string) {
      console.log(`[Auth] app handoff — ${reason}`)
      try {
        sessionStorage.removeItem("sso_app_mode")
        sessionStorage.removeItem("sso_nonce")
        sessionStorage.removeItem("sso_return_to")
      } catch {
        // sessionStorage unavailable — nothing to clean up.
      }
      window.location.href = `${APP_CALLBACK}${query}`
    }

    function fail(reason: string) {
      setFailed(true)
      handOff("?error=1", reason)
    }

    async function handleCallback() {
      try {
        const params = new URLSearchParams(window.location.search)
        const sso = params.get("sso")
        const sig = params.get("sig")

        // WLC signals "no session" via failed=true inside the signed payload
        // (occasionally top-level).
        if (params.get("failed") === "true" || (sso && isSsoFailedPayload(sso))) {
          fail("WLC reported no session")
          return
        }

        if (!sso || !sig) {
          fail("missing sso/sig params")
          return
        }

        // Verify the nonce when we have one. It lives in sessionStorage on this
        // origin — absent if the app started sign-in on a different host, which
        // is exactly the case this route exists to survive, so a missing nonce
        // is not treated as an error (same as /auth/callback).
        let storedNonce: string | null = null
        try {
          storedNonce = sessionStorage.getItem("sso_nonce")
        } catch {
          // ignore
        }
        if (storedNonce && decodeSsoPayload(sso)?.get("nonce") !== storedNonce) {
          fail("nonce mismatch")
          return
        }

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
          fail("edge function returned no token")
          return
        }

        // Keep the web/forum session in sync with the app's.
        storeToken(data.token)
        handOff(`?token=${encodeURIComponent(data.token)}`, "token minted")
      } catch (err) {
        console.error("App callback error:", err)
        fail("unexpected error")
      }
    }

    handleCallback()
  }, [])

  // ─── UI ─────────────────────────────────────────────────────────────────────
  // Only briefly visible: the app closes its sheet as soon as it sees the
  // redirect. The failure copy matters if the scheme can't be opened at all
  // (e.g. someone hits this route in a normal browser).

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-sm px-6">
        {failed ? (
          <>
            <h1 className="text-lg font-semibold text-foreground mb-2">Couldn&apos;t sign in</h1>
            <p className="text-sm text-muted-foreground">
              Return to the app and try again.
            </p>
          </>
        ) : (
          <>
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Returning you to the app…</p>
          </>
        )}
      </div>
    </div>
  )
}
