"use client"

import { useEffect, useState } from "react"

import { useAuth } from "@/components/auth-context"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"

/**
 * Open (unresolved) bug count for the Admin sidebar badge.
 * Uses `dpro-admin` + service role because SSO JWT is not Supabase Auth (anon SELECT is empty under RLS).
 */
export function useBugCount(): number | null {
  const { session, loading: authLoading } = useAuth()
  const token = session?.token ?? null
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!token) {
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
  }, [authLoading, token])

  return count
}
