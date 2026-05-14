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
  const { session } = useAuth()
  const token = session?.token ?? null
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

  const handleShowSelect = async (show: { show_id: string }) => {
    const fullShow = allShows.find((s) => s.show_id === show.show_id)
    if (!fullShow) return
    setSelectedShow(fullShow)
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
    if (!token) return
    setSavingEntryId(entryId)
    try {
      const { error } = await invokeDproAdmin(token, {
        action: "setlist_entries_update",
        entry_id: entryId,
        patch: { radio_id: editingValue.trim() || null },
      })
      if (error) throw new Error(error)
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
    <AdminTabShell>
      <AdminTabToolbar title="WTED Radio IDs">
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
                    <TableHead className="text-center text-sm">Radio ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {setlistEntries.map((entry) => (
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
                        {editingEntryId === entry.entry_id ?
                          <Input
                            ref={inputRef}
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => handleBlur(entry.entry_id)}
                            onKeyDown={(e) => handleKeyDown(e, entry.entry_id)}
                            className="h-7 w-full min-w-[4rem] max-w-[14rem] border border-white/10 bg-black/35 px-2 text-xs text-white/90 outline-none focus-visible:border-[rgba(255,122,103,0.55)] focus-visible:ring-2 focus-visible:ring-[rgba(255,122,103,0.2)]"
                            placeholder="Track ID"
                          />
                        : <button
                            type="button"
                            onClick={() => handleStartEdit(entry)}
                            className="w-full min-w-0 rounded-md px-2 py-0.5 text-left text-xs text-white/90 transition-colors hover:bg-white/[0.06]"
                          >
                            {entry.radio_id || "—"}
                          </button>
                        }
                      </TableCell>
                    </TableRow>
                  ))}
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
          Select a show to manage WTED radio IDs.
        </div>
      )}
    </AdminTabShell>
  )
}
