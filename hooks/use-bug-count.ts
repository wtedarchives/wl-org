"use client"

import { useEffect, useState } from "react"

import { useAuth } from "@/components/auth-context"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"

/**
 * Open (unresolved) bug count for the Admin sidebar / user-menu badge.
 * Only runs when `isAdmin` is true; uses `dpro-admin` + service role because SSO JWT is not Supabase Auth.
 */
export function useBugCount(): number | null {
  const { session, loading: authLoading, isAdmin } = useAuth()
  const token = session?.token ?? null
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    if (authLoading) return
    /** Badge is admin-only; `dpro-admin` rejects non-admins and unverifiable JWTs with 401/403. */
    if (!token || !isAdmin) {
      setCount(null)
      return
    }

    let cancelled = false

    async function fetchOpenBugCount() {
      const { data, error } = await invokeDproAdmin<{ count: number }>(token, {
        action: "bugs_open_count",
      })
      if (cancelled) return
      if (error) {
        setCount(null)
        return
      }
      setCount(data?.count ?? 0)
    }

    void fetchOpenBugCount()

    return () => {
      cancelled = true
    }
  }, [authLoading, isAdmin, token])

  return count
}
