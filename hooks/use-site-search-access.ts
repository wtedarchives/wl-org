"use client"

import { useEffect, useState } from "react"

import { useAuth } from "@/components/auth-context"
import {
  fetchSiteSearchAccess,
  isSiteSearchDevUnlocked,
} from "@/lib/site-search"

/**
 * Whether the signed-in user may see site search (Edge allowlist).
 * Under `next dev`, always allowed (client-side search; production unchanged).
 */
export function useSiteSearchAccess(): {
  allowed: boolean
  loading: boolean
} {
  const { session } = useAuth()
  const devUnlocked = isSiteSearchDevUnlocked()
  const [allowed, setAllowed] = useState(devUnlocked)
  const [loading, setLoading] = useState(
    !devUnlocked && Boolean(session?.token),
  )

  useEffect(() => {
    if (isSiteSearchDevUnlocked()) {
      setAllowed(true)
      setLoading(false)
      return
    }

    const token = session?.token
    if (!token) {
      setAllowed(false)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    void fetchSiteSearchAccess(token)
      .then((ok) => {
        if (!cancelled) setAllowed(ok)
      })
      .catch(() => {
        if (!cancelled) setAllowed(false)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [session?.token])

  return { allowed, loading }
}
