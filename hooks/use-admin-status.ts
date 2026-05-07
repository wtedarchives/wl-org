"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import type { WysteriaSession } from "@/lib/jwt"

export interface UseAdminStatusResult {
  isAdmin: boolean
  loading: boolean
}

/**
 * Hook to check if the current user has admin status.
 * Uses user_roles.is_admin. Returns loading state so callers can wait before redirecting.
 * Keeps loading=true when user exists until fetch completes, avoiding redirect race.
 */
export function useAdminStatus(session: WysteriaSession | null): UseAdminStatusResult {
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [loading, setLoading] = useState(true)
  const fetchedForUserId = useRef<string | null>(null)

  useEffect(() => {
    async function checkAdminStatus() {
      if (!session) {
        fetchedForUserId.current = null
        setIsAdminUser(false)
        setLoading(false)
        return
      }

      if (!supabase) {
        setIsAdminUser(false)
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("is_admin")
          .eq("id", session?.profileId)
          .single()

        if (error) {
          console.error("Error checking admin status:", error)
          setIsAdminUser(false)
          return
        }

        fetchedForUserId.current = session?.profileId
        setIsAdminUser(data?.is_admin ?? false)
      } catch (error) {
        console.error("Error in admin check:", error)
        setIsAdminUser(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [session])

  // When user exists but we haven't fetched for this user yet, we're still loading.
  // This prevents a redirect race when user transitions from null to a real user.
  const isActuallyLoading =
    session && fetchedForUserId.current !== session?.profileId ? true : loading

  return { isAdmin: isAdminUser, loading: isActuallyLoading }
}
