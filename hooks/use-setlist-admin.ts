"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ADMIN_PANEL_ACTIVE_TAB_STORAGE_KEY } from "@/components/dpro/admin/admin-panel.constants"
import type { WysteriaSession } from "@/lib/jwt"

const LEGACY_ADMIN_USER_ID = "8f13a985-ef21-44dc-a381-d6e80c43803f"

/** Set to `false` before shipping — bypasses admin check for setlist admin UI (toolbar, row tools). */
const TEMP_DISABLE_SETLIST_ADMIN_GATE = true

export function useSetlistAdmin(
  session: WysteriaSession | null,
  showId: string | undefined,
  /** Prefer `shows.show_id` from loaded row; falls back to URL param when omitted. */
  clipboardShowId?: string | null,
) {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isAdminLoading, setIsAdminLoading] = useState(true)
  const [linkCopied, setLinkCopied] = useState(false)
  const [wlHovered, setWlHovered] = useState(false)

  const idForClipboard =
    clipboardShowId?.trim() || showId?.trim() || ""

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
    if (!idForClipboard) return
    try {
      await navigator.clipboard.writeText(idForClipboard)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }, [idForClipboard])

  const handleEditShow = useCallback(() => {
    if (!idForClipboard) return
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("adminSelectedShowId", idForClipboard)
      localStorage.setItem(ADMIN_PANEL_ACTIVE_TAB_STORAGE_KEY, "Setlist")
    }
    router.push(
      `/archive/admin?show_id=${encodeURIComponent(idForClipboard)}`,
    )
  }, [idForClipboard, router])

  const handleWlMouseEnter = useCallback(() => setWlHovered(true), [])
  const handleWlMouseLeave = useCallback(() => setWlHovered(false), [])

  const showAdminUi =
    TEMP_DISABLE_SETLIST_ADMIN_GATE ||
    (!isAdminLoading &&
      (isAdmin || session?.profileId === LEGACY_ADMIN_USER_ID))

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
