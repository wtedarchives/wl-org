"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useAuth } from "@/components/auth-context"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import { isDevAuthMockSessionActive } from "@/lib/dev-auth-mock"
import type {
  BrainsMyAssignment,
  BrainsMyAssignmentsResponse,
} from "@/types/brains"

/**
 * In `next dev` with no mock account selected, the caller is treated as an admin so
 * the page can be built and styled without granting a real assignment — matching
 * WlHomeV2AdminGate and AdminGuard, which also step aside in development.
 *
 * Selecting a mock account on the dev bar turns this OFF and honours that account's
 * own `is_admin`. Otherwise signing in as the non-admin `wted-brains` profile would
 * still be handed the admin path, which is exactly the thing it exists to test.
 */
const IS_DEV = process.env.NODE_ENV === "development"

export interface BrainsAccess {
  loading: boolean
  /** Admins reach brains at any time with a full show picker, no window. */
  isAdmin: boolean
  /** Windows open right now, measured against the server clock. */
  active: BrainsMyAssignment[]
  /** Active plus any opening within 24h, used to arm the menu-visibility timer. */
  all: BrainsMyAssignment[]
  /** serverNow − clientNow. Add to `Date.now()` for a trustworthy instant. */
  offsetMs: number
  /** True when the caller may see brains at all. */
  hasAccess: boolean
  /**
   * Dev-bar mock session standing in for a non-admin: the page renders so layout
   * can be checked, but assignments cannot be read because the mock token has a
   * placeholder signature the Edge Function rejects. Always false in production.
   */
  devMockBlocked: boolean
  refresh: () => void
}

/** `Date.now()` corrected by a measured server offset. */
export function serverNowMs(offsetMs: number): number {
  return Date.now() + offsetMs
}

function isOpen(a: BrainsMyAssignment, nowMs: number): boolean {
  const start = new Date(a.access_start).getTime()
  const end = new Date(a.access_end).getTime()
  return Number.isFinite(start) && Number.isFinite(end) && nowMs >= start && nowMs <= end
}

/**
 * The caller's wted-brains access.
 *
 * Deliberately not derived from the JWT: `is_admin` is a stable claim that can
 * live in a 7-day token, but "may edit show X for the next four hours" cannot, so
 * this asks the server. One request per session for almost everyone — the vast
 * majority of users have no assignment and the empty reply ends it.
 *
 * There is no polling. When a window is due to open later the caller re-evaluates
 * on a timer set for that exact boundary, and a focus listener catches
 * assignments created while the tab sat in the background.
 */
export function useBrainsAccess(): BrainsAccess {
  const { session, loading: authLoading, isAdmin } = useAuth()
  const token = session?.token ?? null

  /**
   * null until a reply lands, so `loading` is derived from it rather than kept in
   * a second state that the effect would have to set synchronously.
   */
  const [result, setResult] = useState<{
    assignments: BrainsMyAssignment[]
    offsetMs: number
  } | null>(null)
  // Bumped to re-derive `active` when a window boundary passes.
  const [tick, setTick] = useState(0)
  const boundaryTimerRef = useRef<number | null>(null)

  /**
   * Reads localStorage, which is safe during render and re-evaluates whenever the
   * session changes (the dev bar dispatches `wl-session-updated`). Always false
   * outside `next dev`.
   */
  const mockActive = isDevAuthMockSessionActive()

  const effectiveIsAdmin = isAdmin || (IS_DEV && !mockActive)

  /**
   * A dev mock session cannot call Edge Functions, and an unauthenticated one has
   * nothing to ask for. Both are "no request to make", which keeps the fetch
   * effect free of synchronous state writes.
   */
  const canQuery = !!session && !!token && !mockActive

  // Let a non-admin mock session through the gate so the page can be inspected,
  // rather than bouncing it to "/" with no explanation.
  const devMockBlocked = IS_DEV && mockActive && !isAdmin

  // Refresh is a key bump rather than a separate callable, so there is exactly one
  // code path that fetches and one place that writes state.
  const [reloadKey, setReloadKey] = useState(0)
  const refresh = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    if (authLoading || !canQuery || !token) return
    let cancelled = false

    async function run() {
      const { data, error } = await invokeDproAdmin<BrainsMyAssignmentsResponse>(
        token,
        { action: "brains_my_assignments" },
      )
      if (cancelled) return
      // A failed lookup must not manufacture access. Admins still get in on their
      // JWT claim; everyone else is treated as having no window.
      if (error || !data) {
        setResult({ assignments: [], offsetMs: 0 })
        return
      }
      const serverNow = new Date(data.now).getTime()
      setResult({
        assignments: data.assignments,
        offsetMs: Number.isFinite(serverNow) ? serverNow - Date.now() : 0,
      })
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [authLoading, canQuery, token, reloadKey])

  // Memoized so the empty-case array is referentially stable and does not
  // invalidate the derivations below on every render.
  const assignments = useMemo(() => result?.assignments ?? [], [result])
  const offsetMs = result?.offsetMs ?? 0

  // Re-check when the tab regains focus, so an assignment created while this tab
  // was in the background shows up without a reload.
  useEffect(() => {
    if (!canQuery) return
    window.addEventListener("focus", refresh)
    return () => window.removeEventListener("focus", refresh)
  }, [canQuery, refresh])

  const active = useMemo(() => {
    void tick
    const now = serverNowMs(offsetMs)
    return assignments.filter((a) => isOpen(a, now))
  }, [assignments, offsetMs, tick])

  // Arm a single timer for the next boundary — the soonest start still ahead of
  // us, or the soonest end. Cheaper and more accurate than polling.
  useEffect(() => {
    if (boundaryTimerRef.current !== null) {
      window.clearTimeout(boundaryTimerRef.current)
      boundaryTimerRef.current = null
    }
    if (assignments.length === 0) return

    const now = serverNowMs(offsetMs)
    const boundaries: number[] = []
    for (const a of assignments) {
      const start = new Date(a.access_start).getTime()
      const end = new Date(a.access_end).getTime()
      if (Number.isFinite(start) && start > now) boundaries.push(start)
      if (Number.isFinite(end) && end > now) boundaries.push(end)
    }
    if (boundaries.length === 0) return

    const next = Math.min(...boundaries)
    // +1s so the timer lands just past the boundary, never a millisecond short.
    const delay = Math.max(0, next - now) + 1000
    boundaryTimerRef.current = window.setTimeout(
      () => setTick((t) => t + 1),
      delay,
    )
    return () => {
      if (boundaryTimerRef.current !== null) {
        window.clearTimeout(boundaryTimerRef.current)
        boundaryTimerRef.current = null
      }
    }
  }, [assignments, offsetMs, tick])

  return {
    // Only "loading" while a request we actually intend to make is outstanding.
    loading: authLoading || (canQuery && result === null),
    isAdmin: effectiveIsAdmin,
    active,
    all: assignments,
    offsetMs,
    hasAccess: effectiveIsAdmin || active.length > 0 || devMockBlocked,
    devMockBlocked,
    refresh,
  }
}
