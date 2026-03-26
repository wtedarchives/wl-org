"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"
import type { AdminShowData, DiscographyEntryLink } from "@/types/admin"
import { useShowData } from "@/hooks/use-show-data"
import { formatDate } from "@/lib/utils/show-utils"
import { AdminShowDropdown } from "./admin-show-dropdown"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
type SetlistRow = {
  entry_id: string
  entry_set: string | null
  entry_setnum: number
  entry_song: string | null
}

interface DiscographyEntriesPanelProps {
  discographyUuid: string
}

function sortLinks(rows: DiscographyEntryLink[]): DiscographyEntryLink[] {
  return [...rows].sort((a, b) => a.order - b.order)
}

export function DiscographyEntriesPanel({
  discographyUuid,
}: DiscographyEntriesPanelProps) {
  const [links, setLinks] = useState<DiscographyEntryLink[]>([])
  const [loadingLinks, setLoadingLinks] = useState(true)
  const [songByEntryId, setSongByEntryId] = useState<Record<string, string>>(
    {},
  )
  const [orderDraft, setOrderDraft] = useState<Record<string, string>>({})
  const [panelError, setPanelError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedShow, setSelectedShow] = useState<AdminShowData | null>(null)
  const [setlistEntries, setSetlistEntries] = useState<SetlistRow[]>([])
  const [loadingSetlist, setLoadingSetlist] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [adding, setAdding] = useState(false)

  const lastSyncedDiscographyUuid = useRef<string | null>(null)
  const { allShows, loading, loadingProgress } = useShowData()

  const fetchLinks = useCallback(async () => {
    if (!supabase) return
    setLoadingLinks(true)
    setPanelError(null)
    try {
      const { data, error } = await supabase
        .from("discography_entries")
        .select("*")
        .eq("discography_entry", discographyUuid)
      if (error) throw error
      const raw = (data ?? []) as DiscographyEntryLink[]
      const sorted = sortLinks(raw)
      setLinks(sorted)
      const drafts: Record<string, string> = {}
      for (const r of sorted) drafts[r.uuid] = String(r.order)
      setOrderDraft(drafts)

      const ids = [...new Set(sorted.map((r) => r.setlist_entry))]
      if (ids.length === 0) {
        setSongByEntryId({})
        return
      }
      const { data: songs, error: sErr } = await supabase
        .from("setlist_entries")
        .select("entry_id, entry_song")
        .in("entry_id", ids)
      if (sErr) throw sErr
      const map: Record<string, string> = {}
      for (const row of songs ?? []) {
        map[row.entry_id] = row.entry_song ?? row.entry_id
      }
      setSongByEntryId(map)
    } catch (e) {
      console.error(e)
      setPanelError("Could not load setlist links.")
      setLinks([])
    } finally {
      setLoadingLinks(false)
    }
  }, [discographyUuid])

  useEffect(() => {
    void fetchLinks()
  }, [fetchLinks])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [discographyUuid])

  const fetchSetlistForShow = useCallback(async (showId: string) => {
    if (!supabase) return
    setLoadingSetlist(true)
    try {
      const { data, error } = await supabase
        .from("setlist_entries")
        .select("entry_id, entry_set, entry_setnum, entry_song")
        .eq("entry_show", showId)
        .order("entry_set", { ascending: true })
        .order("entry_setnum", { ascending: true })
      if (error) throw error
      setSetlistEntries((data ?? []) as SetlistRow[])
    } catch {
      setSetlistEntries([])
    } finally {
      setLoadingSetlist(false)
    }
  }, [])

  useEffect(() => {
    if (allShows.length === 0) return
    if (lastSyncedDiscographyUuid.current === discographyUuid) return
    lastSyncedDiscographyUuid.current = discographyUuid
    try {
      const stored = localStorage.getItem("adminSelectedShowId")
      if (stored) {
        const show = allShows.find((s) => s.show_id === stored)
        if (show) {
          setSelectedShow(show)
          void fetchSetlistForShow(show.show_id)
        }
      }
    } catch {
      // ignore
    }
  }, [allShows, discographyUuid, fetchSetlistForShow])

  const filteredShows = useMemo(() => {
    const q = searchTerm.toLowerCase()
    return allShows.filter((show) => {
      const dateStr = formatDate(show.show_date)
      return (
        dateStr.includes(q) ||
        show.show_canonid?.toString().includes(q) ||
        show.show_group.toLowerCase().includes(q) ||
        show.show_venue_location?.toLowerCase().includes(q) ||
        show.show_subvenue.toLowerCase().includes(q)
      )
    })
  }, [allShows, searchTerm])

  const handleShowSelect = async (show: { show_id: string }) => {
    const full = allShows.find((s) => s.show_id === show.show_id)
    if (!full) return
    setSelectedShow(full)
    setIsDropdownOpen(false)
    setSearchTerm("")
    setSelectedIds(new Set())
    try {
      localStorage.setItem("adminSelectedShowId", show.show_id)
    } catch {
      // ignore
    }
    await fetchSetlistForShow(show.show_id)
  }

  const linkCountBySetlistEntry = useMemo(() => {
    const m = new Map<string, number>()
    for (const l of links) {
      m.set(l.setlist_entry, (m.get(l.setlist_entry) ?? 0) + 1)
    }
    return m
  }, [links])

  /** Highest stored order (0 when no links). Next assigned order is `highestOrder + 1` (starts at 1). */
  const highestOrder = useMemo(() => {
    if (links.length === 0) return 0
    return Math.max(...links.map((l) => l.order))
  }, [links])

  const nextOrderLabel = highestOrder + 1

  const saveOrder = async (linkUuid: string) => {
    const raw = orderDraft[linkUuid]
    const n = Number.parseInt(raw ?? "", 10)
    const prev = links.find((l) => l.uuid === linkUuid)
    if (!prev || !supabase || Number.isNaN(n)) {
      setOrderDraft((d) => ({ ...d, [linkUuid]: String(prev?.order ?? 0) }))
      return
    }
    if (n === prev.order) return
    setPanelError(null)
    try {
      const { error } = await supabase
        .from("discography_entries")
        .update({ order: n })
        .eq("uuid", linkUuid)
      if (error) throw error
      await fetchLinks()
    } catch {
      setPanelError("Could not update order.")
      setOrderDraft((d) => ({ ...d, [linkUuid]: String(prev.order) }))
    }
  }

  const handleDelete = async (uuid: string) => {
    if (!supabase) return
    setDeleting(true)
    setPanelError(null)
    try {
      const { error } = await supabase
        .from("discography_entries")
        .delete()
        .eq("uuid", uuid)
      if (error) throw error
      setDeleteTarget(null)
      await fetchLinks()
    } catch {
      setPanelError("Could not delete link.")
    } finally {
      setDeleting(false)
    }
  }

  const toggleSelected = (entryId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(entryId)
      else next.delete(entryId)
      return next
    })
  }

  const handleAddSelected = async () => {
    if (!supabase || selectedIds.size === 0) return
    setAdding(true)
    setPanelError(null)
    try {
      const base = highestOrder
      const ids = [...selectedIds]
      const rows = ids.map((setlist_entry, i) => ({
        setlist_entry,
        discography_entry: discographyUuid,
        order: base + i + 1,
      }))
      const { error } = await supabase.from("discography_entries").insert(rows)
      if (error) throw error
      setSelectedIds(new Set())
      await fetchLinks()
    } catch {
      setPanelError("Could not add links.")
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 bg-muted/15">
      <h3 className="text-sm font-semibold">Setlist links</h3>
      <p className="min-w-0 hyphens-auto text-pretty text-[11px] leading-snug text-muted-foreground break-words">
        Link setlist lines to this release. Order controls display sequence.
        Duplicate song lines are allowed.
      </p>
      {panelError ? (
        <div className="rounded border border-destructive/40 bg-destructive/10 px-2 py-1.5 text-[11px] text-destructive">
          {panelError}
        </div>
      ) : null}

      {loadingLinks ? (
        <p className="text-xs text-muted-foreground">Loading links…</p>
      ) : links.length === 0 ? (
        <p className="text-xs text-muted-foreground">No links yet.</p>
      ) : (
        <div className="w-full min-w-0 overflow-x-auto rounded-md border border-border/80">
          <Table className="min-w-[18rem]">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-14 py-0.5 text-xs">Order</TableHead>
                <TableHead className="py-0.5 text-xs">Song</TableHead>
                <TableHead className="w-16 py-0.5 text-right text-xs">
                  Delete
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.map((link) => (
                <TableRow key={link.uuid}>
                  <TableCell className="py-0.5">
                    <Input
                      type="number"
                      className="h-6 w-14 px-1 py-0.5 text-xs tabular-nums leading-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      value={orderDraft[link.uuid] ?? ""}
                      onChange={(e) =>
                        setOrderDraft((d) => ({
                          ...d,
                          [link.uuid]: e.target.value,
                        }))
                      }
                      onBlur={() => void saveOrder(link.uuid)}
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap py-0.5 text-xs">
                    {songByEntryId[link.setlist_entry] ?? "—"}
                  </TableCell>
                  <TableCell className="py-0.5 text-right">
                    {deleteTarget === link.uuid ? (
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="text-[10px] px-1.5 py-0.5"
                          disabled={deleting}
                          onClick={() => void handleDelete(link.uuid)}
                        >
                          OK
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-[10px] px-1.5 py-0.5"
                          onClick={() => setDeleteTarget(null)}
                        >
                          No
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-[10px] text-destructive px-1.5 py-0.5"
                        onClick={() => setDeleteTarget(link.uuid)}
                      >
                        Delete
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex flex-col gap-0 border-t border-border/60 pt-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium">Add from setlist</span>
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
            portalToBody={false}
          />
        </div>
        {selectedShow ? (
          <p className="mb-2 text-[11px] text-muted-foreground">
            {formatDate(selectedShow.show_date)} – {selectedShow.show_subvenue}
          </p>
        ) : null}

        {loadingSetlist ? (
          <p className="text-xs text-muted-foreground">Loading setlist…</p>
        ) : setlistEntries.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {selectedShow
              ? "No setlist entries for this show."
              : "Pick a show to list setlist lines."}
          </p>
        ) : (
          <>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                className="h-7 text-xs"
                disabled={selectedIds.size === 0 || adding}
                onClick={() => void handleAddSelected()}
              >
                {adding
                  ? "Adding…"
                  : `Add selected (${selectedIds.size}) from order ${nextOrderLabel}`}
              </Button>
            </div>
            <div className="w-full min-w-0 overflow-x-auto rounded-md border border-border/80">
              <Table className="min-w-[36rem]">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-10 py-0.5 pl-2 text-center text-xs">
                      <span className="sr-only">Select</span>
                    </TableHead>
                    <TableHead className="w-8 py-0.5 text-xs">S</TableHead>
                    <TableHead className="w-8 py-0.5 text-xs">#</TableHead>
                    <TableHead className="min-w-[12rem] py-0.5 text-xs">
                      Song
                    </TableHead>
                    <TableHead className="min-w-[5.5rem] py-0.5 text-xs">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {setlistEntries.map((e) => {
                    const count = linkCountBySetlistEntry.get(e.entry_id) ?? 0
                    const linked = count > 0
                    return (
                      <TableRow key={e.entry_id}>
                        <TableCell className="py-0.5 pl-2">
                          <Checkbox
                            checked={selectedIds.has(e.entry_id)}
                            onCheckedChange={(c) =>
                              toggleSelected(e.entry_id, c === true)
                            }
                            aria-label={`Select ${e.entry_song ?? e.entry_id}`}
                          />
                        </TableCell>
                        <TableCell className="py-0.5 text-center text-xs">
                          {e.entry_set}
                        </TableCell>
                        <TableCell className="py-0.5 text-center text-xs">
                          {e.entry_setnum}
                        </TableCell>
                        <TableCell className="whitespace-nowrap py-0.5 text-xs">
                          {e.entry_song ?? "—"}
                        </TableCell>
                        <TableCell className="py-0.5">
                          {linked ? (
                            <Badge variant="secondary" className="text-[10px]">
                              On release{count > 1 ? ` ×${count}` : ""}
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
