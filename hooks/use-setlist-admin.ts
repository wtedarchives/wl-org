"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

const LEGACY_ADMIN_USER_ID = "8f13a985-ef21-44dc-a381-d6e80c43803f"

export function useSetlistAdmin(user: User | null, showId: string | undefined) {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isAdminLoading, setIsAdminLoading] = useState(true)
  const [linkCopied, setLinkCopied] = useState(false)
  const [wlHovered, setWlHovered] = useState(false)

  useEffect(() => {
    if (!user) {
      setIsAdmin(false)
      setIsAdminLoading(false)
      return
    }

    const cacheKey = `admin_status_${user.id}`
    const cached = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(cacheKey) : null
    if (cached !== null) {
      setIsAdmin(cached === "true")
      setIsAdminLoading(false)
      return
    }

    const userId = user.id
    async function check() {
      if (!supabase) {
        setIsAdminLoading(false)
        return
      }
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("is_admin")
          .eq("id", userId)
          .single()

        if (!error && data?.is_admin) {
          setIsAdmin(true)
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.setItem(cacheKey, "true")
          }
        }
      } catch (err) {
        console.error("Error checking admin status:", err)
      } finally {
        setIsAdminLoading(false)
      }
    }
    check()
  }, [user])

  const handleCopyLink = useCallback(async () => {
    if (!showId) return
    try {
      await navigator.clipboard.writeText(showId)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }, [showId])

  const handleEditShow = useCallback(() => {
    if (!showId) return
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("adminSelectedShowId", showId)
      localStorage.setItem("adminActiveTab", "Setlist")
    }
    router.push(
      `/old/archive/admin?show_id=${encodeURIComponent(showId)}`,
    )
  }, [showId, router])

  const handleWlMouseEnter = useCallback(() => setWlHovered(true), [])
  const handleWlMouseLeave = useCallback(() => setWlHovered(false), [])

  const showAdminUi =
    !isAdminLoading && (isAdmin || user?.id === LEGACY_ADMIN_USER_ID)

  return {
    isAdmin,
    isAdminLoading,
    showAdminUi,
    linkCopied,
    wlHovered,
    handleCopyLink,
    handleEditShow,
    handleWlMouseEnter,
    handleWlMouseLeave,
  }
}
