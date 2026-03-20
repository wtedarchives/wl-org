"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { formatDate } from "@/lib/utils/show-utils"
import type { AdminShowData } from "@/types/admin"
import type { AdminSetlistEntryData } from "@/types/admin"
import type { ReleaseShow } from "@/types/admin"
import { useShowData } from "@/hooks/use-show-data"
import { useShowReleases } from "@/hooks/use-show-releases"

export function useAdminMedia() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedShow, setSelectedShow] = useState<AdminShowData | null>(null)
  const [setlistEntries, setSetlistEntries] = useState<AdminSetlistEntryData[]>(
    []
  )
  const [mediaEntries, setMediaEntries] = useState<Set<string>>(new Set())
  const [loadingSetlist, setLoadingSetlist] = useState(false)
  const [togglingEntry, setTogglingEntry] = useState<string | null>(null)
  const [hoveredReleaseId, setHoveredReleaseId] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number
    y: number
  } | null>(null)
  const headerRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const showDataLoadedRef = useRef(false)

  const { allShows, loading, loadingProgress } = useShowData()
  const { showReleases, loadingReleases, fetchShowReleases } = useShowReleases()

  const fetchSetlistEntries = async (showId: string) => {
    if (!supabase) return
    try {
      setLoadingSetlist(true)
      const { data, error } = await supabase
        .from("setlist_entries")
        .select(
          "entry_id, entry_set, entry_setnum, entry_setorder, entry_song, entry_short, entry_segue, entry_placement"
        )
        .eq("entry_show", showId)
        .order("entry_set", { ascending: true })
        .order("entry_setnum", { ascending: true })
        .order("entry_setorder", { ascending: true })
      if (error) throw error
      setSetlistEntries((data || []) as AdminSetlistEntryData[])
    } catch {
      setSetlistEntries([])
    } finally {
      setLoadingSetlist(false)
    }
  }

  const fetchMediaEntries = async (showId: string) => {
    if (!supabase) return
    try {
      const { data: entries, error: entriesError } = await supabase
        .from("setlist_entries")
        .select("entry_id")
        .eq("entry_show", showId)
      if (entriesError) throw entriesError
      if (!entries || entries.length === 0) {
        setMediaEntries(new Set())
        return
      }
      const entryIds = entries.map((e) => e.entry_id)
      const { data: mediaData, error: mediaError } = await supabase
        .from("setlist_entry_media")
        .select("setlist_entry_id, release_id")
        .in("setlist_entry_id", entryIds)
      if (mediaError) throw mediaError
      const mediaSet = new Set<string>()
      if (mediaData) {
        mediaData.forEach((media) => {
          mediaSet.add(`${media.setlist_entry_id}:${media.release_id}`)
        })
      }
      setMediaEntries(mediaSet)
    } catch {
      setMediaEntries(new Set())
    }
  }

  useEffect(() => {
    if (allShows.length > 0 && !showDataLoadedRef.current) {
      showDataLoadedRef.current = true
      try {
        const storedShowId = localStorage.getItem("adminSelectedShowId")
        if (storedShowId) {
          const storedShow = allShows.find((s) => s.show_id === storedShowId)
          if (storedShow) {
            setSelectedShow(storedShow)
            Promise.all([
              fetchSetlistEntries(storedShow.show_id),
              fetchShowReleases(storedShow.show_id),
              fetchMediaEntries(storedShow.show_id),
            ])
          }
        }
      } catch {
        // silent
      }
    }
  }, [allShows])

  useEffect(() => {
    const h = (e: StorageEvent) => {
      if (e.key === "adminSelectedShowId" && e.newValue) {
        const newShow = allShows.find((s) => s.show_id === e.newValue)
        if (newShow && (!selectedShow || selectedShow.show_id !== e.newValue)) {
          setSelectedShow(newShow)
          Promise.all([
            fetchSetlistEntries(newShow.show_id),
            fetchShowReleases(newShow.show_id),
            fetchMediaEntries(newShow.show_id),
          ])
        }
      }
    }
    window.addEventListener("storage", h)
    return () => window.removeEventListener("storage", h)
  }, [selectedShow, allShows])

  useEffect(() => {
    const h = () => {
      if (document.visibilityState === "visible") {
        try {
          const storedShowId = localStorage.getItem("adminSelectedShowId")
          if (storedShowId && (!selectedShow || selectedShow.show_id !== storedShowId)) {
            const storedShow = allShows.find((s) => s.show_id === storedShowId)
            if (storedShow) {
              setSelectedShow(storedShow)
              Promise.all([
                fetchSetlistEntries(storedShow.show_id),
                fetchShowReleases(storedShow.show_id),
                fetchMediaEntries(storedShow.show_id),
              ])
            }
          } else if (selectedShow) {
            Promise.all([
              fetchSetlistEntries(selectedShow.show_id),
              fetchShowReleases(selectedShow.show_id),
              fetchMediaEntries(selectedShow.show_id),
            ])
          }
        } catch {
          // silent
        }
      }
    }
    document.addEventListener("visibilitychange", h)
    return () => document.removeEventListener("visibilitychange", h)
  }, [selectedShow, allShows])

  const filteredShows = useMemo(() => {
    return allShows.filter((show) => {
      const searchLower = searchTerm.toLowerCase()
      const dateStr = formatDate(show.show_date)
      return (
        dateStr.includes(searchLower) ||
        show.show_canonid?.toString().includes(searchLower) ||
        show.show_group.toLowerCase().includes(searchLower) ||
        show.show_venue_location?.toLowerCase().includes(searchLower) ||
        show.show_subvenue.toLowerCase().includes(searchLower)
      )
    })
  }, [allShows, searchTerm])

  const handleShowSelect = async (show: { show_id: string }) => {
    const fullShow = allShows.find((s) => s.show_id === show.show_id)
    if (!fullShow) return
    setSelectedShow(fullShow)
    setIsDropdownOpen(false)
    setSearchTerm("")
    try {
      localStorage.setItem("adminSelectedShowId", show.show_id)
    } catch {
      // silent
    }
    await Promise.all([
      fetchSetlistEntries(show.show_id),
      fetchShowReleases(show.show_id),
      fetchMediaEntries(show.show_id),
    ])
  }

  const handleToggleMedia = async (entryId: string, releaseId: string) => {
    const key = `${entryId}:${releaseId}`
    const isChecked = mediaEntries.has(key)
    setTogglingEntry(key)
    if (!supabase) return
    try {
      if (isChecked) {
        const { error } = await supabase
          .from("setlist_entry_media")
          .delete()
          .eq("setlist_entry_id", entryId)
          .eq("release_id", releaseId)
        if (error) throw error
        const next = new Set(mediaEntries)
        next.delete(key)
        setMediaEntries(next)
      } else {
        const { error } = await supabase
          .from("setlist_entry_media")
          .insert({ setlist_entry_id: entryId, release_id: releaseId })
        if (error) throw error
        const next = new Set(mediaEntries)
        next.add(key)
        setMediaEntries(next)
      }
    } catch {
      // silent
    } finally {
      setTogglingEntry(null)
    }
  }

  const handleToggleAllForRelease = async (releaseId: string) => {
    if (!selectedShow || setlistEntries.length === 0 || !supabase) return
    const allChecked = setlistEntries.every((e) =>
      mediaEntries.has(`${e.entry_id}:${releaseId}`)
    )
    const shouldCheckAll = !allChecked
    const ops: Promise<void>[] = []
    for (const entry of setlistEntries) {
      const key = `${entry.entry_id}:${releaseId}`
      const isCurrentlyChecked = mediaEntries.has(key)
      if (shouldCheckAll && !isCurrentlyChecked) {
        ops.push(
          supabase
            .from("setlist_entry_media")
            .insert({
              setlist_entry_id: entry.entry_id,
              release_id: releaseId,
            })
            .then(({ error }) => {
              if (error) throw error
            }) as Promise<void>
        )
      } else if (!shouldCheckAll && isCurrentlyChecked) {
        ops.push(
          supabase
            .from("setlist_entry_media")
            .delete()
            .eq("setlist_entry_id", entry.entry_id)
            .eq("release_id", releaseId)
            .then(({ error }) => {
              if (error) throw error
            }) as Promise<void>
        )
      }
    }
    try {
      await Promise.all(ops)
      const next = new Set(mediaEntries)
      for (const entry of setlistEntries) {
        const key = `${entry.entry_id}:${releaseId}`
        if (shouldCheckAll) next.add(key)
        else next.delete(key)
      }
      setMediaEntries(next)
    } catch {
      // silent
    }
  }

  useEffect(() => {
    if (hoveredReleaseId && headerRefs.current[hoveredReleaseId]) {
      const el = headerRefs.current[hoveredReleaseId]
      if (el) {
        const rect = el.getBoundingClientRect()
        setTooltipPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 4,
        })
      }
    } else {
      setTooltipPosition(null)
    }
  }, [hoveredReleaseId])

  return {
    searchTerm,
    setSearchTerm,
    isDropdownOpen,
    setIsDropdownOpen,
    selectedShow,
    setlistEntries,
    mediaEntries,
    loadingSetlist,
    loadingReleases,
    togglingEntry,
    hoveredReleaseId,
    setHoveredReleaseId,
    tooltipPosition,
    headerRefs,
    showReleases,
    filteredShows,
    loading,
    loadingProgress,
    handleShowSelect,
    handleToggleMedia,
    handleToggleAllForRelease,
  }
}
