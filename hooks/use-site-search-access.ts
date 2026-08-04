"use client"

import { useEffect, useState } from "react"

import { useAuth } from "@/components/auth-context"
import { fetchSiteSearchAccess } from "@/lib/site-search"

/**
 * Whether the signed-in user may see site search (Edge allowlist).
 * Returns false while loading / signed out / not allowlisted.
 */
export function useSiteSearchAccess(): {
  allowed: boolean
  loading: boolean
} {
  const { session } = useAuth()
  const [allowed, setAllowed] = useState(false)
  const [loading, setLoading] = useState(Boolean(session?.token))

  useEffect(() => {
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
