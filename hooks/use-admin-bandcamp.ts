"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useAuth } from "@/components/auth-context"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import { supabase } from "@/lib/supabase"
import { formatDate } from "@/lib/utils/show-utils"
import type { AdminShowData } from "@/types/admin"
import { useShowData } from "@/hooks/use-show-data"
import type {
  BandcampSetlistEntry,
  ScrapedAlbum,
  TrackAssignment,
} from "@/components/dpro/admin/admin-bandcamp.types"

export function useAdminBandcamp() {
  const { session } = useAuth()
  const token = session?.token ?? null
  const [searchTerm, setSearchTerm] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedShow, setSelectedShow] = useState<AdminShowData | null>(null)
  const [setlistEntries, setSetlistEntries] = useState<BandcampSetlistEntry[]>(
    [],
  )
  const [loadingSetlist, setLoadingSetlist] = useState(false)
  /** entry_id -> assigned track (or absent = unassigned). */
  const [assignments, setAssignments] = useState<
    Record<string, TrackAssignment>
  >({})
  const [savingEntryId, setSavingEntryId] = useState<string | null>(null)

  const [albumUrl, setAlbumUrl] = useState("")
  const [album, setAlbum] = useState<ScrapedAlbum | null>(null)
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const showDataLoadedRef = useRef(false)
  const { allShows, loading, loadingProgress } = useShowData()

  const fetchSetlistAndAssignments = async (showId: string) => {
    if (!supabase) return
    const client = supabase
    setLoadingSetlist(true)

    // 1. Setlist entries — the primary data for the table.
    let rows: BandcampSetlistEntry[] = []
    try {
      const { data: entries, error } = await client
        .from("setlist_entries")
        .select(
          "entry_id, entry_set, entry_setnum, entry_setorder, entry_song, entry_short, entry_segue, entry_placement",
        )
        .eq("entry_show", showId)
        .order("entry_set", { ascending: true })
        .order("entry_setnum", { ascending: true })
        .order("entry_setorder", { ascending: true })
      if (error) throw error
      rows = (entries || []) as BandcampSetlistEntry[]
    } catch {
      rows = []
    }
    setSetlistEntries(rows)

    // 2. Existing assignments — supplementary; a failure here (e.g. table not yet
    //    migrated) must NOT clear the setlist above.
    try {
      const ids = rows.map((r) => r.entry_id)
      if (ids.length > 0) {
        const { data: links, error: linkErr } = await client
          .from("bandcamp_tracks")
          .select("entry_id, track_id, track_link, track_title, album_id, album_url")
          .in("entry_id", ids)
        if (linkErr) throw linkErr
        const map: Record<string, TrackAssignment> = {}
        for (const l of links ?? []) {
          map[l.entry_id as string] = {
            track_id: Number(l.track_id),
            track_link: l.track_link as string,
            track_title: (l.track_title as string | null) ?? null,
            album_id: Number(l.album_id),
            album_url: (l.album_url as string | null) ?? null,
          }
        }
        setAssignments(map)
      } else {
        setAssignments({})
      }
    } catch {
      setAssignments({})
    } finally {
      setLoadingSetlist(false)
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
            fetchSetlistAndAssignments(storedShow.show_id)
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
          fetchSetlistAndAssignments(newShow.show_id)
        }
      }
    }
    window.addEventListener("storage", h)
    return () => window.removeEventListener("storage", h)
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
    await fetchSetlistAndAssignments(show.show_id)
  }

  const handleFetchTracks = async () => {
    const url = albumUrl.trim()
    if (!url) return
    setFetching(true)
    setFetchError(null)
    try {
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/functions/v1`
        : ""
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!base || !anon) {
        setAlbum(null)
        setFetchError("Missing Supabase configuration.")
        return
      }
      const res = await fetch(
        `${base}/bandcamp-album-tracks?url=${encodeURIComponent(url)}`,
        {
          headers: { apikey: anon, Authorization: `Bearer ${anon}` },
        },
      )
      const data = (await res.json()) as ScrapedAlbum & { error?: string }
      if (!res.ok || data.error) {
        setAlbum(null)
        setFetchError(data.error ?? `Request failed (${res.status})`)
      } else {
        setAlbum(data)
      }
    } catch {
      setAlbum(null)
      setFetchError("Failed to reach the scrape endpoint.")
    } finally {
      setFetching(false)
    }
  }

  /** Options for an entry's dropdown: scraped album tracks + any already-assigned track. */
  const optionsForEntry = (entryId: string): TrackAssignment[] => {
    const opts: TrackAssignment[] = (album?.tracks ?? []).map((t) => ({
      track_id: t.track_id,
      track_link: t.track_link,
      track_title: t.title,
      album_id: album!.album_id,
      album_url: album!.album_url,
    }))
    const current = assignments[entryId]
    if (current && !opts.some((o) => o.track_id === current.track_id)) {
      opts.unshift(current)
    }
    return opts
  }

  const handleAssign = async (entryId: string, trackIdStr: string) => {
    if (!token) return
    setSavingEntryId(entryId)
    try {
      if (trackIdStr === "") {
        const { error } = await invokeDproAdmin(token, {
          action: "bandcamp_tracks_delete",
          entry_id: entryId,
        })
        if (error) throw new Error(error)
        setAssignments((prev) => {
          const next = { ...prev }
          delete next[entryId]
          return next
        })
      } else {
        const trackId = Number(trackIdStr)
        const opt = optionsForEntry(entryId).find(
          (o) => o.track_id === trackId,
        )
        if (!opt) throw new Error("Track not found")
        const { error } = await invokeDproAdmin(token, {
          action: "bandcamp_tracks_upsert",
          entry_id: entryId,
          track_link: opt.track_link,
          track_id: opt.track_id,
          track_title: opt.track_title,
          album_id: opt.album_id,
          album_url: opt.album_url,
        })
        if (error) throw new Error(error)
        setAssignments((prev) => ({ ...prev, [entryId]: opt }))
      }
    } catch {
      // silent — re-fetch to resync on error
      if (selectedShow) fetchSetlistAndAssignments(selectedShow.show_id)
    } finally {
      setSavingEntryId(null)
    }
  }

  return {
    searchTerm,
    setSearchTerm,
    isDropdownOpen,
    setIsDropdownOpen,
    selectedShow,
    setlistEntries,
    loadingSetlist,
    assignments,
    savingEntryId,
    albumUrl,
    setAlbumUrl,
    album,
    fetching,
    fetchError,
    filteredShows,
    loading,
    loadingProgress,
    handleShowSelect,
    handleFetchTracks,
    optionsForEntry,
    handleAssign,
  }
}
