"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

export interface UseAdminStatusResult {
  isAdmin: boolean
  loading: boolean
}

/**
 * Hook to check if the current user has admin status.
 * Uses user_roles.is_admin. Returns loading state so callers can wait before redirecting.
 * Keeps loading=true when user exists until fetch completes, avoiding redirect race.
 */
export function useAdminStatus(user: User | null): UseAdminStatusResult {
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [loading, setLoading] = useState(true)
  const fetchedForUserId = useRef<string | null>(null)

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
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
          .eq("id", user.id)
          .single()

        if (error) {
          console.error("Error checking admin status:", error)
          setIsAdminUser(false)
          return
        }

        fetchedForUserId.current = user.id
        setIsAdminUser(data?.is_admin ?? false)
      } catch (error) {
        console.error("Error in admin check:", error)
        setIsAdminUser(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [user])

  // When user exists but we haven't fetched for this user yet, we're still loading.
  // This prevents a redirect race when user transitions from null to a real user.
  const isActuallyLoading =
    user && fetchedForUserId.current !== user.id ? true : loading

  return { isAdmin: isAdminUser, loading: isActuallyLoading }
}
