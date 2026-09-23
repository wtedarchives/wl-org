"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import {
  fetchWtedRequests,
  mergeWtedGuestRequests,
} from "@/lib/wted-request-edge"
import type { WtedRequestEnriched } from "@/types/wted"

export function useWtedRequests(accessToken: string | null, open: boolean) {
  const scope = open ? (accessToken ?? "guest") : "closed"
  const [readyScope, setReadyScope] = useState<string | null>(null)
  const [requests, setRequests] = useState<WtedRequestEnriched[]>([])
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  const fetchRequests = useCallback(async () => {
    const id = ++requestId.current
    const fetchScope = open ? (accessToken ?? "guest") : "closed"
    setError(null)
    try {
      if (accessToken) {
        try {
          await mergeWtedGuestRequests(accessToken)
        } catch {
          // Keep the guest token so a later open can retry the merge.
        }
      }
      const next = await fetchWtedRequests(accessToken)
      if (requestId.current !== id) return
      setRequests(next)
    } catch (err) {
      if (requestId.current !== id) return
      setError(err instanceof Error ? err.message : "Failed to fetch requests")
      setRequests([])
    } finally {
      if (requestId.current === id) setReadyScope(fetchScope)
    }
  }, [accessToken, open])

  useEffect(() => {
    if (!open) return
    void fetchRequests()
  }, [open, fetchRequests])

  return {
    requests,
    loading: open && readyScope !== scope,
    error,
    ready: open && readyScope === scope,
    refetch: fetchRequests,
  }
}
