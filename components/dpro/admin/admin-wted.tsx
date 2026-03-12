"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { formatDate } from "@/lib/utils/show-utils"
import { getPlacementColor } from "@/components/dpro/setlistgame/song-selection/utils"
import type { AdminShowData } from "@/types/admin"
import { useShowData } from "@/hooks/use-show-data"
import { AdminShowDropdown } from "./admin-show-dropdown"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface WtedSetlistEntry {
  entry_id: string
  entry_set: string | null
  entry_setnum: number
  entry_setorder: number
  entry_song: string | null
  entry_short: string | null
  entry_segue: string | null
  entry_placement: string | null
  radio_id: string | null
}

export function AdminWted() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedShow, setSelectedShow] = useState<AdminShowData | null>(null)
  const [setlistEntries, setSetlistEntries] = useState<WtedSetlistEntry[]>([])
  const [loadingSetlist, setLoadingSetlist] = useState(false)
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState("")
  const [savingEntryId, setSavingEntryId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const showDataLoadedRef = useRef(false)

  const { allShows, loading, loadingProgress } = useShowData()

  const fetchSetlistEntries = async (showId: string) => {
    if (!supabase) return
    try {
      setLoadingSetlist(true)
      const { data, error } = await supabase
        .from("setlist_entries")
        .select(
          "entry_id, entry_set, entry_setnum, entry_setorder, entry_song, entry_short, entry_segue, entry_placement, radio_id"
        )
        .eq("entry_show", showId)
        .order("entry_set", { ascending: true })
        .order("entry_setnum", { ascending: true })
        .order("entry_setorder", { ascending: true })
      if (error) throw error
      setSetlistEntries((data || []) as WtedSetlistEntry[])
    } catch {
      setSetlistEntries([])
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
            fetchSetlistEntries(storedShow.show_id)
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
          fetchSetlistEntries(newShow.show_id)
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
              fetchSetlistEntries(storedShow.show_id)
            }
          } else if (selectedShow) {
            fetchSetlistEntries(selectedShow.show_id)
          }
        } catch {
          // silent
        }
      }
    }
    document.addEventListener("visibilitychange", h)
    return () => document.removeEventListener("visibilitychange", h)
  }, [selectedShow, allShows])

  useEffect(() => {
    if (editingEntryId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingEntryId])

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
    setEditingEntryId(null)
    try {
      localStorage.setItem("adminSelectedShowId", show.show_id)
    } catch {
      // silent
    }
    await fetchSetlistEntries(show.show_id)
  }

  const handleStartEdit = (entry: WtedSetlistEntry) => {
    setEditingEntryId(entry.entry_id)
    setEditingValue(entry.radio_id || "")
  }

  const handleCancelEdit = () => {
    setEditingEntryId(null)
    setEditingValue("")
  }

  const handleSaveRadioId = async (entryId: string) => {
    if (!supabase) return
    setSavingEntryId(entryId)
    try {
      const { error } = await supabase
        .from("setlist_entries")
        .update({ radio_id: editingValue.trim() || null })
        .eq("entry_id", entryId)
      if (error) throw error
      setSetlistEntries((prev) =>
        prev.map((e) =>
          e.entry_id === entryId
            ? { ...e, radio_id: editingValue.trim() || null }
            : e
        )
      )
    } catch {
      // silent
    } finally {
      setSavingEntryId(null)
      setEditingEntryId(null)
      setEditingValue("")
    }
  }

  const handleBlur = (entryId: string) => {
    if (savingEntryId === entryId) return
    const entry = setlistEntries.find((e) => e.entry_id === entryId)
    const originalValue = entry?.radio_id || ""
    const trimmed = editingValue.trim()
    if (trimmed !== originalValue) {
      handleSaveRadioId(entryId)
    } else {
      handleCancelEdit()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, entryId: string) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSaveRadioId(entryId)
    } else if (e.key === "Escape") {
      e.preventDefault()
      handleCancelEdit()
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">WTED Radio IDs</h3>
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
        <div className="overflow-hidden rounded-lg border border-border">
          {loadingSetlist ? (
            <div className="flex items-center justify-center gap-2 p-3">
              <div className="flex gap-2">
                <div className="size-3 animate-pulse rounded-lg bg-muted" />
                <div className="size-3 animate-pulse rounded-lg bg-muted [animation-delay:150ms]" />
                <div className="size-3 animate-pulse rounded-lg bg-muted [animation-delay:300ms]" />
              </div>
              <p className="ml-2 text-xs text-muted-foreground">
                Loading setlist...
              </p>
            </div>
          ) : setlistEntries.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60">
                    <TableHead className="py-1 text-center text-xs border-r">S</TableHead>
                    <TableHead className="py-1 text-center text-xs border-r">#</TableHead>
                    <TableHead className="py-1 text-left text-xs border-r">Song</TableHead>
                    <TableHead className="py-1 text-left text-xs border-r">Short</TableHead>
                    <TableHead className="py-1 text-left text-xs border-r">→</TableHead>
                    <TableHead className="py-1 text-center text-xs border-r">
                      Placement
                    </TableHead>
                    <TableHead className="py-1 text-center text-xs border-r">
                      Radio ID
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {setlistEntries.map((entry) => (
                    <TableRow
                      key={entry.entry_id}
                      className="text-xs hover:bg-muted/50"
                    >
                      <TableCell className="py-1 text-center border-r">
                        {entry.entry_set}
                      </TableCell>
                      <TableCell className="py-1 text-center border-r">
                        {entry.entry_setnum}
                      </TableCell>
                      <TableCell className="py-1 border-r">
                        {entry.entry_song}
                      </TableCell>
                      <TableCell className="py-1 border-r">
                        {entry.entry_short || ""}
                      </TableCell>
                      <TableCell className="py-1 border-r">
                        {entry.entry_segue === ">" ? "→" : (entry.entry_segue || "")}
                      </TableCell>
                      <TableCell className="py-1 border-r">
                        <div
                          className="mx-auto w-fit rounded-lg px-2 py-0.5 text-center font-medium"
                          style={{
                            backgroundColor: getPlacementColor(
                              entry.entry_placement ?? undefined
                            ),
                            color: "white",
                          }}
                        >
                          {entry.entry_placement || ""}
                        </div>
                      </TableCell>
                      <TableCell className="py-1 border-r">
                        {editingEntryId === entry.entry_id ? (
                        <Input
                          ref={inputRef}
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => handleBlur(entry.entry_id)}
                          onKeyDown={(e) => handleKeyDown(e, entry.entry_id)}
                          className="h-7 min-w-16 px-1.5 py-0.5 text-xs"
                          placeholder="Track ID"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(entry)}
                          className="w-full px-2 py-0.5 text-left text-xs hover:bg-muted/50 rounded"
                        >
                          {entry.radio_id || "—"}
                        </button>
                      )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-background p-3 text-center text-xs text-muted-foreground">
              No setlist entries found for this show.
            </div>
          )}
        </div>
      )}
      {!selectedShow && !loading && (
        <div className="rounded-lg border border-border bg-background p-3 text-center text-xs text-muted-foreground">
          Select a show to manage WTED radio IDs.
        </div>
      )}
    </div>
  )
}
