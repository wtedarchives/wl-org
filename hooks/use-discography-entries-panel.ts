"use client"

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react"
import { supabase } from "@/lib/supabase"
import type { AdminShowData, DiscographyEntryLink } from "@/types/admin"
import { useShowData } from "@/hooks/use-show-data"
import { formatDate } from "@/lib/utils/show-utils"

export type DiscographyEntriesSetlistRow = {
  entry_id: string
  entry_set: string | null
  entry_setnum: number
  entry_song: string | null
}

function sortLinks(rows: DiscographyEntryLink[]): DiscographyEntryLink[] {
  return [...rows].sort((a, b) => a.order - b.order)
}

export function useDiscographyEntriesPanel(discographyUuid: string) {
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
  const [setlistEntries, setSetlistEntries] = useState<
    DiscographyEntriesSetlistRow[]
  >([])
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
      setSetlistEntries((data ?? []) as DiscographyEntriesSetlistRow[])
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

  const handleShowSelect = useCallback(
    async (show: { show_id: string }) => {
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
    },
    [allShows, fetchSetlistForShow],
  )

  const linkCountBySetlistEntry = useMemo(() => {
    const m = new Map<string, number>()
    for (const l of links) {
      m.set(l.setlist_entry, (m.get(l.setlist_entry) ?? 0) + 1)
    }
    return m
  }, [links])

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

  return {
    links,
    loadingLinks,
    songByEntryId,
    orderDraft,
    setOrderDraft,
    panelError,
    deleteTarget,
    setDeleteTarget,
    deleting,
    saveOrder,
    handleDelete,
    searchTerm,
    setSearchTerm,
    isDropdownOpen,
    setIsDropdownOpen,
    selectedShow,
    setlistEntries,
    loadingSetlist,
    selectedIds,
    adding,
    filteredShows,
    handleShowSelect,
    linkCountBySetlistEntry,
    nextOrderLabel,
    toggleSelected,
    handleAddSelected,
    allShowsLoading: loading,
    loadingProgress,
  }
}
