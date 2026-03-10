"use client"

import { useEffect, useRef, useState } from "react"
import type { SetlistEntry } from "@/types/setlist"

const DESKTOP_MIN_WIDTH = 1280

export function useSetlistPageState(showId: string) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [layoutMode, setLayoutMode] = useState<"mobile" | "desktop">("desktop")
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [hoveredReleaseId, setHoveredReleaseId] = useState<string | null>(null)
  const [ratingDrawerOpen, setRatingDrawerOpen] = useState(false)
  const [loginRequiredOpen, setLoginRequiredOpen] = useState(false)
  const [wtedLoginRequiredOpen, setWtedLoginRequiredOpen] = useState(false)
  const [songSheetOpen, setSongSheetOpen] = useState(false)
  const [songSheetEntry, setSongSheetEntry] = useState<SetlistEntry | null>(null)
  const [jotyDrawerOpen, setJotyDrawerOpen] = useState(false)
  const [jotyDrawerYear, setJotyDrawerYear] = useState<number | null>(null)
  const [jotyDrawerHighlightedEntryId, setJotyDrawerHighlightedEntryId] =
    useState<string | null>(null)
  const [wtedSheetOpen, setWtedSheetOpen] = useState(false)
  const [wtedSheetEntry, setWtedSheetEntry] = useState<SetlistEntry | null>(null)
  const [setlistScanDrawerOpen, setSetlistScanDrawerOpen] = useState(false)
  const [copiedEntryIds, setCopiedEntryIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    setHoveredReleaseId(null)
  }, [showId])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () =>
      setLayoutMode(el.clientWidth >= DESKTOP_MIN_WIDTH ? "desktop" : "mobile")
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const handleNumberClick = async (entryId: string) => {
    try {
      await navigator.clipboard.writeText(entryId)
      setCopiedEntryIds((prev) => new Set(prev).add(entryId))
      setTimeout(() => {
        setCopiedEntryIds((prev) => {
          const next = new Set(prev)
          next.delete(entryId)
          return next
        })
      }, 2000)
    } catch {
      // ignore
    }
  }

  return {
    containerRef,
    layoutMode,
    hoveredCategory,
    setHoveredCategory,
    hoveredReleaseId,
    setHoveredReleaseId,
    ratingDrawerOpen,
    setRatingDrawerOpen,
    loginRequiredOpen,
    setLoginRequiredOpen,
    wtedLoginRequiredOpen,
    setWtedLoginRequiredOpen,
    songSheetOpen,
    setSongSheetOpen,
    songSheetEntry,
    setSongSheetEntry,
    jotyDrawerOpen,
    setJotyDrawerOpen,
    jotyDrawerYear,
    setJotyDrawerYear,
    jotyDrawerHighlightedEntryId,
    setJotyDrawerHighlightedEntryId,
    wtedSheetOpen,
    setWtedSheetOpen,
    wtedSheetEntry,
    setWtedSheetEntry,
    setlistScanDrawerOpen,
    setSetlistScanDrawerOpen,
    copiedEntryIds,
    handleNumberClick,
  }
}
