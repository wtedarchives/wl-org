"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { Show } from "@/types/setlist"

export function useSetlistNavigation(show: Show | null) {
  const router = useRouter()
  const pathname = usePathname()
  const [openChangesModal, setOpenChangesModal] = useState(false)
  const [showCoachNotes, setShowCoachNotes] = useState(true)
  const [scrollToReleases, setScrollToReleases] = useState(false)

  useEffect(() => {
    const url = typeof window !== "undefined" ? window.location.href : ""
    const params = typeof window !== "undefined" ? window.location.search : ""
    if (params.includes("openChangesModal") || url.includes("openChangesModal")) {
      setOpenChangesModal(true)
    }
    if (params.includes("scrollToReleases") || url.includes("scrollToReleases")) {
      setScrollToReleases(true)
    }
  }, [pathname])

  const handleTourSelect = (tourId: string) => {
    router.push(`/archive/tours/${tourId}`)
  }

  const handleShowSelect = (showId: string) => {
    router.push(`/archive/setlist/${showId}`)
  }

  return {
    openChangesModal,
    setOpenChangesModal,
    showCoachNotes,
    setShowCoachNotes,
    handleTourSelect,
    handleShowSelect,
    scrollToReleases,
  }
}
