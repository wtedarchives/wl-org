"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { Check } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { formatDate } from "@/lib/utils/show-utils"
import { getPlacementColor } from "@/components/dpro/setlistgame/song-selection/utils"
import type { AdminShowData } from "@/types/admin"
import type { AdminSetlistEntryData } from "@/types/admin"
import type { ReleaseShow } from "@/types/admin"
import { useShowData } from "@/hooks/use-show-data"
import { useShowReleases } from "@/hooks/use-show-releases"
import { AdminShowDropdown } from "./admin-show-dropdown"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

const NugsIcon = () => (
  <img
    src="/NugsColor.png"
    alt="nugs"
    className="inline-block size-3.5 w-auto"
  />
)

function getServiceIcon(serviceName: string | null) {
  if (!serviceName) return null
  switch (serviceName.toLowerCase()) {
    case "youtube":
      return (
        <span className="inline-block text-[#FF0033] text-sm font-bold">▶</span>
      )
    case "bandcamp":
      return (
        <span className="inline-block text-[#1b96bb] text-sm font-bold">BC</span>
      )
    case "nugs":
      return <NugsIcon />
    case "spotify":
      return (
        <span className="inline-block text-[#1ed760] text-sm font-bold">♫</span>
      )
    default:
      return null
  }
}

export function AdminMedia() {
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

  const handleShowSelect = async (show: AdminShowData) => {
    setSelectedShow(show)
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

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Media Management</h3>
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
      </div>
      {selectedShow && (
        <div className="mb-2 px-2 pb-1">
          <h4 className="text-sm font-medium">
            {formatDate(selectedShow.show_date)} - {selectedShow.show_subvenue}
          </h4>
        </div>
      )}
      {selectedShow && (
        <div className="overflow-x-auto">
          {loadingSetlist || loadingReleases ? (
            <div className="flex h-32 items-center justify-center">
              <div className="size-8 animate-spin rounded-lg border-2 border-primary border-t-transparent" />
            </div>
          ) : setlistEntries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center text-xs border-r">S</TableHead>
                  <TableHead className="text-center text-xs border-r">#</TableHead>
                  <TableHead className="text-left text-xs border-r">Song</TableHead>
                  <TableHead className="text-left text-xs border-r">Short</TableHead>
                  <TableHead className="text-left text-xs border-r">&gt;</TableHead>
                  <TableHead className="text-center text-xs border-r">
                    Placement
                  </TableHead>
                  {showReleases.map((rs: ReleaseShow) => {
                    const allChecked =
                      setlistEntries.length > 0 &&
                      setlistEntries.every((e) =>
                        mediaEntries.has(`${e.entry_id}:${rs.release_id}`)
                      )
                    const someChecked = setlistEntries.some((e) =>
                      mediaEntries.has(`${e.entry_id}:${rs.release_id}`)
                    )
                    return (
                      <TableHead
                        key={rs.release_id}
                        className="text-center text-xs border-r"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <div
                            ref={(el) => {
                              headerRefs.current[rs.release_id] = el
                            }}
                            className="cursor-pointer"
                            onMouseEnter={() =>
                              setHoveredReleaseId(rs.release_id)
                            }
                            onMouseLeave={() => setHoveredReleaseId(null)}
                          >
                            {getServiceIcon(rs.releases?.release_service ?? null)}
                          </div>
                          <Button
                            variant={allChecked ? "default" : "outline"}
                            size="sm"
                            className="size-4 p-0"
                            onClick={() =>
                              handleToggleAllForRelease(rs.release_id)
                            }
                            title={allChecked ? "Deselect all" : "Select all"}
                          >
                            {allChecked && <Check className="size-2.5" />}
                            {someChecked && !allChecked && (
                              <span className="text-[0.5rem]">−</span>
                            )}
                          </Button>
                        </div>
                      </TableHead>
                    )
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {setlistEntries.map((entry) => (
                  <TableRow
                    key={entry.entry_id}
                    className="text-[0.625rem] hover:bg-muted/50"
                  >
                    <TableCell className="text-center border-r">
                      {entry.entry_set}
                    </TableCell>
                    <TableCell className="text-center border-r">
                      {entry.entry_setnum}
                    </TableCell>
                    <TableCell className="font-medium border-r">
                      {entry.entry_song}
                    </TableCell>
                    <TableCell className="border-r">
                      {entry.entry_short || ""}
                    </TableCell>
                    <TableCell className="border-r">
                      {entry.entry_segue || ""}
                    </TableCell>
                    <TableCell className="border-r">
                      <div
                        className="mx-auto w-fit rounded-lg px-2 py-0.5 text-center font-medium"
                        style={{
                          backgroundColor: getPlacementColor(
                            entry.entry_placement ?? undefined
                          ),
                          color:
                            getPlacementColor(
                              entry.entry_placement ?? undefined
                            ) !== "transparent"
                              ? "white"
                              : "black",
                        }}
                      >
                        {entry.entry_placement || ""}
                      </div>
                    </TableCell>
                    {showReleases.map((rs: ReleaseShow) => {
                      const key = `${entry.entry_id}:${rs.release_id}`
                      const isChecked = mediaEntries.has(key)
                      const isToggling = togglingEntry === key
                      return (
                        <TableCell
                          key={rs.release_id}
                          className="text-center border-r"
                        >
                          <Button
                            variant={isChecked ? "default" : "outline"}
                            size="sm"
                            className="size-4 p-0"
                            onClick={() =>
                              handleToggleMedia(entry.entry_id, rs.release_id)
                            }
                            disabled={isToggling}
                          >
                            {isChecked && <Check className="size-3" />}
                          </Button>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded border bg-background p-3 text-center">
              <p className="text-xs text-muted-foreground">
                No setlist entries found for this show.
              </p>
            </div>
          )}
        </div>
      )}
      {!selectedShow && !loading && (
        <div className="rounded border bg-background p-3 text-center">
          <p className="text-xs text-muted-foreground">
            Select a show to view its media assignments.
          </p>
        </div>
      )}
      {hoveredReleaseId &&
        tooltipPosition &&
        (() => {
          const rs = showReleases.find(
            (r: ReleaseShow) => r.release_id === hoveredReleaseId
          )
          if (!rs) return null
          return createPortal(
            <div
              className="pointer-events-none fixed z-[99999] rounded border bg-background px-2 py-1 text-[0.625rem] font-medium shadow-lg"
              style={{
                left: tooltipPosition.x,
                top: tooltipPosition.y,
                transform: "translate(-50%, -100%)",
                marginTop: "-4px",
              }}
            >
              <div className="font-medium">{rs.releases?.release_displayname}</div>
              {rs.releases?.release_service && (
                <div className="mt-0.5 opacity-75">
                  {rs.releases.release_service}
                </div>
              )}
            </div>,
            document.body
          )
        })()}
    </div>
  )
}
