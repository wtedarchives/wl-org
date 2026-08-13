"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { useAuth } from "@/components/auth-context"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"

export type BrainsRebuildStatus = "idle" | "running" | "queued" | "error"

interface RebuildResponse {
  ran: boolean
  reason?: "cooldown" | "in_progress"
  retryAfterMs?: number
}

/** Small cushion so a retry lands after the window it is waiting on, not on it. */
const RETRY_PADDING_MS = 2_000

export interface UseBrainsStatsRebuild {
  status: BrainsRebuildStatus
  /**
   * Ask for a stats rebuild. Returns immediately — the request is never awaited by
   * the caller's save path.
   */
  trigger: () => void
}

/**
 * Keeps `update_all_setlist_entries` running automatically after brains edits,
 * without ever making the setlister wait for it.
 *
 * The rebuild takes 30–45 seconds and touches every entry in the archive, so
 * awaiting it per save — which is what the Admin Panel's `useSetlistEntryActions`
 * does — would mean a 45-second pause after every song. Instead the entry save
 * completes on its own and this fires the rebuild alongside it.
 *
 * The catch with fire-and-forget is the tail: the global advisory lock and the 90s
 * cooldown both legitimately refuse a run, and the refused one might be the LAST
 * save of the night, leaving stats stale. So a skipped attempt schedules itself to
 * retry once the server says it is worth trying again. One timer at a time, so a
 * burst of twenty saves collapses into one eventual rebuild rather than twenty.
 */
export function useBrainsStatsRebuild(): UseBrainsStatsRebuild {
  const { session } = useAuth()
  const token = session?.token ?? null

  const [status, setStatus] = useState<BrainsRebuildStatus>("idle")
  const timerRef = useRef<number | null>(null)
  /** Guards against two overlapping in-flight requests from this tab. */
  const inFlightRef = useRef(false)
  /** A save that arrived while a rebuild was running still needs one afterwards. */
  const dirtyRef = useRef(false)
  const tokenRef = useRef(token)

  useEffect(() => {
    tokenRef.current = token
  }, [token])

  const runRef = useRef<() => void>(() => {})

  const schedule = useCallback((delayMs: number) => {
    if (timerRef.current !== null) return
    setStatus("queued")
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      runRef.current()
    }, delayMs + RETRY_PADDING_MS)
  }, [])

  const run = useCallback(() => {
    const currentToken = tokenRef.current
    if (!currentToken) return
    if (inFlightRef.current) {
      dirtyRef.current = true
      return
    }
    inFlightRef.current = true
    setStatus("running")

    void (async () => {
      const { data, error } = await invokeDproAdmin<RebuildResponse>(
        currentToken,
        { action: "rpc_update_all_setlist_entries" },
      )
      inFlightRef.current = false

      if (error) {
        setStatus("error")
        return
      }
      if (data && data.ran === false) {
        schedule(data.retryAfterMs ?? 90_000)
        return
      }
      // A rebuild completed. If edits landed while it ran, the numbers it produced
      // are already behind — go again once the cooldown allows.
      if (dirtyRef.current) {
        dirtyRef.current = false
        schedule(90_000)
        return
      }
      setStatus("idle")
    })()
  }, [schedule])

  useEffect(() => {
    runRef.current = run
  }, [run])

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    },
    [],
  )

  const trigger = useCallback(() => {
    if (inFlightRef.current) {
      dirtyRef.current = true
      return
    }
    // Cancel a pending retry: this fresh attempt supersedes it.
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    run()
  }, [run])

  return { status, trigger }
}
