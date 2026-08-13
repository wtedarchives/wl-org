"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  DEV_AUTH_MOCK_PROFILE_IDS,
  DEV_AUTH_MOCK_PROFILES,
  getActiveDevAuthMockProfileId,
  setDevAuthMockProfile,
  type DevAuthMockProfileId,
} from "@/lib/dev-auth-mock"
import { cn } from "@/lib/utils"

const IS_DEV = process.env.NODE_ENV === "development"

/**
 * Fixed bottom strip (`next dev` only): sign in as one of the dev profiles.
 * Omitted from production bundles (`NODE_ENV` is inlined at build time).
 *
 * Two accounts, because an admin session cannot exercise wted-brains: admins skip
 * the assignment and window checks entirely. Signing in as the non-admin
 * `wted-brains` profile is the only way to see the setlister path — the countdown,
 * the read-only lockout, the "no show assigned" state.
 */
export function DevAuthMockBar() {
  const [active, setActive] = React.useState<DevAuthMockProfileId | null>(null)

  React.useEffect(() => {
    if (!IS_DEV) return
    setActive(getActiveDevAuthMockProfileId())
  }, [])

  React.useEffect(() => {
    if (!IS_DEV || typeof document === "undefined") return
    const prev = document.body.style.paddingBottom
    document.body.style.paddingBottom = "3.25rem"
    return () => {
      document.body.style.paddingBottom = prev
    }
  }, [])

  React.useEffect(() => {
    if (!IS_DEV || typeof window === "undefined") return
    const sync = () => setActive(getActiveDevAuthMockProfileId())
    window.addEventListener("storage", sync)
    window.addEventListener("wl-session-updated", sync)
    return () => {
      window.removeEventListener("storage", sync)
      window.removeEventListener("wl-session-updated", sync)
    }
  }, [])

  if (!IS_DEV) return null

  const choose = (next: DevAuthMockProfileId | null) => {
    setDevAuthMockProfile(next)
    setActive(next)
  }

  const activeProfile = active ? DEV_AUTH_MOCK_PROFILES[active] : null

  return (
    <footer
      role="region"
      aria-label="Development auth mock"
      className="fixed bottom-0 left-0 right-0 z-[200] flex min-h-11 shrink-0 flex-wrap items-center justify-center gap-2 border-t border-zinc-700 bg-zinc-950/95 px-4 py-2 text-xs text-zinc-300 backdrop-blur-sm"
    >
      <span className="font-medium text-amber-200/90">Dev: sign in as</span>

      <div role="group" aria-label="Mock account" className="flex items-center gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-pressed={active === null}
          onClick={() => choose(null)}
          className={cn(
            "h-8 border-amber-500/40 px-2 text-xs",
            active === null && "border-amber-400 bg-amber-950/80 text-amber-100",
          )}
        >
          Off
        </Button>
        {DEV_AUTH_MOCK_PROFILE_IDS.map((id) => {
          const profile = DEV_AUTH_MOCK_PROFILES[id]
          const isOn = active === id
          return (
            <Button
              key={id}
              type="button"
              size="sm"
              variant="outline"
              aria-pressed={isOn}
              onClick={() => choose(id)}
              className={cn(
                "h-8 border-amber-500/40 px-2 text-xs",
                isOn && "border-amber-400 bg-amber-950/80 text-amber-100",
              )}
              title={`${profile.username} — ${profile.hint}`}
            >
              {profile.username}
            </Button>
          )
        })}
      </div>

      <span className="max-w-[min(100%,32rem)] truncate text-zinc-500">
        {activeProfile
          ? `${activeProfile.hint} · Edge Function calls will fail (unsigned token)`
          : "local only"}
      </span>
    </footer>
  )
}
