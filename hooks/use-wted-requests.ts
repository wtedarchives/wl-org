"use client"

import { useCallback, useEffect, useState } from "react"

import { fetchWtedRequests } from "@/lib/wted-request-edge"
import type { WtedRequestEnriched } from "@/types/wted"

export function useWtedRequests(accessToken: string | null, open: boolean) {
  const [requests, setRequests] = useState<WtedRequestEnriched[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    setError(null)
    try {
      const requests = await fetchWtedRequests(accessToken)
      setRequests(requests)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch requests")
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (open && accessToken) {
      fetchRequests()
    }
  }, [open, accessToken, fetchRequests])

  return { requests, loading, error, refetch: fetchRequests }
}
