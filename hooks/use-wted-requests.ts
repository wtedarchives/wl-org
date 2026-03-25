"use client"

import { useCallback, useEffect, useState } from "react"

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
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/functions/v1`
        : ""
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      const res = await fetch(`${base}/wted-requests`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...(anon ? { apikey: anon } : {}),
        },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Failed to fetch requests")
      }
      const data = await res.json()
      setRequests(data.requests ?? [])
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
