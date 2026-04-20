"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import type { SetlistEntry, Show, ShowDate, GuestGroup } from "@/types/setlist"
import {
  calculateShowPosition,
  sortGuestsForSetlistDisplay,
} from "@/lib/setlist-utils"

export function useShowPosition(show: Show | null, showDates: ShowDate[]) {
  const [position, setPosition] = useState<{
    current: number
    total: number
    prevShowId: string | null
    nextShowId: string | null
  } | null>(null)

  useEffect(() => {
    if (!show) {
      setPosition(null)
      return
    }
    setPosition(calculateShowPosition(show, showDates))
  }, [show, showDates])

  return position
}

export function useAttendeeCount(
  showId: string | undefined,
  show: Show | null
) {
  const [attendeeCount, setAttendeeCount] = useState(0)

  useEffect(() => {
    if (!showId || !show || !supabase) return
    const client = supabase
    async function fetchCount() {
      const { count, error } = await client
          .from("user_attended_shows")
          .select("*", { count: "exact", head: true })
          .eq("show_id", showId)
      if (!error) setAttendeeCount(count ?? 0)
    }
    fetchCount()
  }, [showId, show?.show_id])

  return { attendeeCount, setAttendeeCount }
}

export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(typeof window !== "undefined" && window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])
  return isMobile
}

const GUEST_COLORS = [
  "#0bacc9", "#e4482f", "#fcb924", "#67a343", "#9e598f", "#be823a",
  "#f58ba2", "#7b6e66", "#ec7523", "#050608", "#fee4d3", "#5a2c08", "#8ecfbb",
]

export function useGuestGroups(setlist: SetlistEntry[]): GuestGroup[] {
  return useMemo(() => {
    const seen = new Set<string>()
    const result: GuestGroup[] = []
    setlist.forEach((entry) => {
      if (!entry.guests?.length) return
      const sorted = sortGuestsForSetlistDisplay(entry.guests)
      const key = sorted.map((g) => g.guest_canonid).join(",")
      if (seen.has(key)) return
      seen.add(key)
      const color = GUEST_COLORS[result.length % GUEST_COLORS.length]
      result.push({ color, guests: sorted })
    })
    return result
  }, [setlist])
}

export function useHoverStates() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [hoveredEntry, setHoveredEntry] = useState<string | null>(null)
  const [hoveredSong, setHoveredSong] = useState<string | null>(null)
  const [hoveredPersonnel, setHoveredPersonnel] = useState<string | null>(null)
  return {
    mousePosition,
    setMousePosition,
    hoveredEntry,
    setHoveredEntry,
    hoveredSong,
    setHoveredSong,
    hoveredPersonnel,
    setHoveredPersonnel,
  }
}

export function useModalState() {
  const [modalSongData, setModalSongData] = useState({
    isOpen: false,
    songName: "",
  })
  return { modalSongData, setModalSongData }
}

export function useCopiedEntries() {
  const [copiedEntries, setCopiedEntries] = useState<Set<string>>(new Set())

  const handleNumberClick = useCallback(
    async (entryId: string, isAdmin: boolean) => {
      if (!isAdmin) return
      try {
        await navigator.clipboard.writeText(entryId)
        setCopiedEntries((prev) => new Set(prev).add(entryId))
        setTimeout(() => {
          setCopiedEntries((prev) => {
            const next = new Set(prev)
            next.delete(entryId)
            return next
          })
        }, 2000)
      } catch (err) {
        console.error("Failed to copy:", err)
      }
    },
    []
  )

  return { copiedEntries, handleNumberClick }
}
