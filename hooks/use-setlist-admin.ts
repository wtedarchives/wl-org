"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { WysteriaSession } from "@/lib/jwt"

const LEGACY_ADMIN_USER_ID = "8f13a985-ef21-44dc-a381-d6e80c43803f"

export function useSetlistAdmin(session: WysteriaSession | null, showId: string | undefined) {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isAdminLoading, setIsAdminLoading] = useState(true)
  const [linkCopied, setLinkCopied] = useState(false)
  const [wlHovered, setWlHovered] = useState(false)

  useEffect(() => {
    if (!session) {
      setIsAdmin(false)
      setIsAdminLoading(false)
      return
    }
    setIsAdmin(session.isAdmin)
    setIsAdminLoading(false)
  }, [session])

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
    !isAdminLoading && (isAdmin || session?.profileId === LEGACY_ADMIN_USER_ID)

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
