"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useAuth } from "@/components/auth-context"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import { supabase } from "@/lib/supabase"
import { formatDate } from "@/lib/utils/show-utils"
import { cn } from "@/lib/utils"
import { getPlacementBarCssToken } from "@/lib/placement-bar-color"
import type { AdminShowData } from "@/types/admin"
import { useShowData } from "@/hooks/use-show-data"
import { AdminShowDropdown } from "./admin-show-dropdown"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AdminTabShell } from "./admin-tab-shell"
import { AdminTabToolbar } from "./admin-tab-toolbar"

interface BandcampSetlistEntry {
  entry_id: string
  entry_set: string | null
  entry_setnum: number
  entry_setorder: number
  entry_song: string | null
  entry_short: string | null
  entry_segue: string | null
  entry_placement: string | null
}

interface ScrapedTrack {
  track_id: number
  title: string
  track_link: string
}

interface ScrapedAlbum {
  album_id: number
  album_url: string
  album_title: string | null
  tracks: ScrapedTrack[]
}

/** The Bandcamp track assigned to a given setlist entry (from DB or a fresh pick). */
interface TrackAssignment {
  track_id: number
  track_link: string
  track_title: string | null
  album_id: number
  album_url: string | null
}

export function AdminBandcamp() {
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
    try {
      setLoadingSetlist(true)
      const { data: entries, error } = await supabase
        .from("setlist_entries")
        .select(
          "entry_id, entry_set, entry_setnum, entry_setorder, entry_song, entry_short, entry_segue, entry_placement",
        )
        .eq("entry_show", showId)
        .order("entry_set", { ascending: true })
        .order("entry_setnum", { ascending: true })
        .order("entry_setorder", { ascending: true })
      if (error) throw error
      const rows = (entries || []) as BandcampSetlistEntry[]
      setSetlistEntries(rows)

      const ids = rows.map((r) => r.entry_id)
      if (ids.length > 0) {
        const { data: links, error: linkErr } = await supabase
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
      setSetlistEntries([])
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

  return (
    <AdminTabShell>
      <AdminTabToolbar title="Bandcamp Track Links">
        <Input
          type="url"
          value={albumUrl}
          onChange={(e) => setAlbumUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleFetchTracks()
            }
          }}
          placeholder="Bandcamp album URL"
          className="h-8 w-full min-w-[16rem] max-w-[26rem] border border-white/10 bg-black/35 px-2 text-xs text-white/90"
        />
        <Button
          type="button"
          size="sm"
          onClick={handleFetchTracks}
          disabled={fetching || !albumUrl.trim()}
        >
          {fetching ? "Fetching…" : "Fetch tracks"}
        </Button>
        <AdminShowDropdown
          isOpen={isDropdownOpen}
          onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filteredShows={filteredShows}
          onShowSelect={handleShowSelect}
          loading={loading}
          loadingProgress={loadingProgress}
          selectedShow={selectedShow}
        />
      </AdminTabToolbar>

      {fetchError ?
        <div className="rounded-lg border border-[rgba(255,122,103,0.4)] bg-[rgba(255,122,103,0.08)] px-3 py-2 text-xs text-[rgb(255,168,150)]">
          {fetchError}
        </div>
      : album ?
        <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-white/70">
          Loaded <span className="font-medium text-white/90">
            {album.album_title ?? "album"}
          </span>{" "}
          — {album.tracks.length} tracks. Assign them to setlist entries below.
        </div>
      : null}

      {selectedShow && (
        <div className="widget-panel wl-home-v2-years-shows-panel wl-home-v2-years-shows-panel--natural flex min-h-0 min-w-0 flex-1 flex-col">
          <div
            className={cn(
              "wp-head wl-home-v2-years-shows-wp-head wl-home-v2-tours-shows-wp-head",
              "flex w-full min-w-0 shrink-0 flex-row flex-wrap items-center gap-x-3 gap-y-2 border-b border-[rgb(29,32,30)] pb-3",
            )}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="wp-head-date min-w-0 truncate">
                {formatDate(selectedShow.show_date)} [{selectedShow.show_group}]
              </span>
              <span className="text-[11px] leading-snug text-white/55">
                {selectedShow.show_subvenue} — {selectedShow.show_venue_location}
              </span>
            </div>
          </div>
          {loadingSetlist ?
            <div className="flex flex-1 items-center justify-center gap-2 px-3 py-10">
              <div className="flex gap-2">
                <div className="size-3 animate-pulse rounded-lg bg-muted" />
                <div className="size-3 animate-pulse rounded-lg bg-muted [animation-delay:150ms]" />
                <div className="size-3 animate-pulse rounded-lg bg-muted [animation-delay:300ms]" />
              </div>
              <p className="ml-2 text-xs text-white/65">Loading setlist...</p>
            </div>
          : setlistEntries.length > 0 ?
            <div className="wl-home-v2-years-table-scroll min-h-0 min-w-0 flex-1">
              <Table className="set-table wl-home-v2-admin-setlist-entry-table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8 text-center text-sm">S</TableHead>
                    <TableHead className="w-8 text-center text-sm">#</TableHead>
                    <TableHead className="text-left text-sm">Song</TableHead>
                    <TableHead className="text-left text-sm">Short</TableHead>
                    <TableHead className="text-center text-sm">→</TableHead>
                    <TableHead className="text-center text-sm">Placement</TableHead>
                    <TableHead className="text-left text-sm">Bandcamp track</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {setlistEntries.map((entry) => {
                    const options = optionsForEntry(entry.entry_id)
                    const current = assignments[entry.entry_id]
                    return (
                      <TableRow key={entry.entry_id} className="text-[0.625rem]">
                        <TableCell className="text-center text-xs">
                          {entry.entry_set}
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          {entry.entry_setnum}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {entry.entry_song}
                        </TableCell>
                        <TableCell className="text-xs">
                          {entry.entry_short ?? ""}
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          {(entry.entry_segue ?? "").replace(/>/g, "→")}
                        </TableCell>
                        <TableCell className="text-center">
                          <div
                            className="wl-home-v2-archive-admin-placement-pill inline-block align-middle"
                            data-admin-placement-pill={getPlacementBarCssToken(
                              entry.entry_placement,
                            )}
                          >
                            {entry.entry_placement ?? ""}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <select
                            value={current ? String(current.track_id) : ""}
                            disabled={
                              savingEntryId === entry.entry_id ||
                              options.length === 0
                            }
                            onChange={(e) =>
                              handleAssign(entry.entry_id, e.target.value)
                            }
                            className="h-7 w-full min-w-[8rem] max-w-[20rem] rounded-md border border-white/10 bg-black/35 px-2 text-xs text-white/90 outline-none focus-visible:border-[rgba(15,162,209,0.55)] focus-visible:ring-2 focus-visible:ring-[rgba(15,162,209,0.2)] disabled:opacity-50"
                          >
                            <option value="">— None —</option>
                            {options.map((o) => (
                              <option key={o.track_id} value={String(o.track_id)}>
                                {o.track_title ?? o.track_link}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          : <div className="px-1 py-6 text-center text-xs text-white/65">
              <p className="m-0">No setlist entries found for this show.</p>
            </div>}
        </div>
      )}
      {!selectedShow && !loading && (
        <div className="rounded-lg border border-border bg-background p-3 text-center text-xs text-muted-foreground">
          Fetch an album&apos;s tracks, then select a show to assign Bandcamp
          track links to its setlist entries.
        </div>
      )}
    </AdminTabShell>
  )
}
