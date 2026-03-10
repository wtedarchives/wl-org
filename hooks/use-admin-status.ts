"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

/**
 * Hook to check if the current user has admin status for the Setlist Game.
 * Uses user_roles.is_admin. Separate from useSetlistAdmin to avoid affecting other pages.
 */
export function useAdminStatus(user: User | null): boolean {
  const [isAdminUser, setIsAdminUser] = useState(false)

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setIsAdminUser(false)
        return
      }

      if (!supabase) {
        setIsAdminUser(false)
        return
      }

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

        setIsAdminUser(data?.is_admin ?? false)
      } catch (error) {
        console.error("Error in admin check:", error)
        setIsAdminUser(false)
      }
    }

    checkAdminStatus()
  }, [user])

  return isAdminUser
}
