"use client"

import * as React from "react"

import { Label } from "@/components/ui/label"
import { Toggle } from "@/components/ui/toggle"
import {
  isDevAuthMockSessionActive,
  setDevAuthMockEnabled,
} from "@/lib/dev-auth-mock"

const IS_DEV = process.env.NODE_ENV === "development"

/**
 * Fixed bottom strip (`next dev` only): simulate signed-in session for local testing.
 * Omits from production bundles (`next build` + `next start`); `NODE_ENV` is inlined.
 */
export function DevAuthMockBar() {
  const [mockOn, setMockOn] = React.useState(false)

  React.useEffect(() => {
    if (!IS_DEV) return
    setMockOn(isDevAuthMockSessionActive())
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
    const sync = () => setMockOn(isDevAuthMockSessionActive())
    window.addEventListener("storage", sync)
    window.addEventListener("wl-session-updated", sync)
    return () => {
      window.removeEventListener("storage", sync)
      window.removeEventListener("wl-session-updated", sync)
    }
  }, [])

  if (!IS_DEV) return null

  const handlePressedChange = (pressed: boolean) => {
    setDevAuthMockEnabled(pressed)
    setMockOn(pressed)
  }

  return (
    <footer
      role="region"
      aria-label="Development auth mock"
      className="fixed bottom-0 left-0 right-0 z-[200] flex min-h-11 shrink-0 items-center justify-center gap-3 border-t border-zinc-700 bg-zinc-950/95 px-4 py-2 text-xs text-zinc-300 backdrop-blur-sm transition-all duration-200 ease-out"
    >
      <Label
        htmlFor="dev-auth-mock-toggle"
        className="cursor-pointer font-medium text-amber-200/90"
      >
        Dev: mock login
      </Label>
      <Toggle
        id="dev-auth-mock-toggle"
        size="lg"
        variant="outline"
        pressed={mockOn}
        onPressedChange={handlePressedChange}
        className="min-h-11 min-w-11 border-amber-500/40 data-[state=on]:border-amber-400 data-[state=on]:bg-amber-950/80 data-[state=on]:text-amber-100"
        aria-label={
          mockOn ? "Disable mock logged-in session" : "Enable mock logged-in session"
        }
      />
      <span className="max-w-[min(100%,28rem)] truncate text-zinc-500">
        watsonbriant · local only
      </span>
    </footer>
  )
}
