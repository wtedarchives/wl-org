"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { DiscographyEntryLink } from "@/types/admin"
import type {
  DiscographyShowColumnCell,
  SetlistEntry,
} from "@/types/setlist"
import {
  mapSupabaseSetlistRowToEntry,
  SETLIST_ENTRY_DETAIL_SELECT,
} from "@/lib/map-supabase-setlist-entry-row"
import { formatDate } from "@/lib/utils/show-utils"

type ShowDiscographyFields = {
  show_id: string
  show_date: string
  show_venue_location: string | null
  show_group: string | null
  discography_display: boolean | null
  show_subvenue_venue?: string | null
  subvenues?: { venues?: { venue_id: string } | null } | null
}

/** WTED sheet / display: keyed by `show_id` (`SetlistEntry.entry_show`). */
export type DiscographyLinkedShowContext = {
  show_date: string
  show_venue_location: string | null
  show_group: string | null
}

function sortLinks(rows: DiscographyEntryLink[]): DiscographyEntryLink[] {
  return [...rows].sort((a, b) => a.order - b.order)
}

function buildDiscographySourceColumns(
  entries: SetlistEntry[],
  showsById: Map<string, ShowDiscographyFields>,
): {
  labels: string[]
  cells: (DiscographyShowColumnCell | null)[]
} {
  const labels: string[] = []
  const cells: (DiscographyShowColumnCell | null)[] = []
  for (const entry of entries) {
    const show = showsById.get(entry.entry_show)
    if (!show || !show.discography_display) {
      labels.push("")
      cells.push(null)
      continue
    }
    const dateStr = formatDate(show.show_date)
    const loc = show.show_venue_location?.trim() || null
    labels.push(loc ? `${dateStr} [${loc}]` : dateStr)
    const venueId = show.subvenues?.venues?.venue_id ?? null
    const venueSlug = show.show_subvenue_venue?.trim() || null
    cells.push({
      showId: show.show_id,
      venueId,
      venueSlug,
      dateLabel: dateStr,
      venueLabel: loc,
    })
  }
  return { labels, cells }
}

export function useDiscographyLinkedSetlist(discographyUuid: string | undefined) {
  const [setlist, setSetlist] = useState<SetlistEntry[]>([])
  /** Stable React keys (discography_entries.uuid); aligns with `setlist` when duplicates exist. */
  const [rowKeys, setRowKeys] = useState<string[]>([])
  /** `discography_entries.order` per row; aligns with `setlist`. */
  const [discographyOrders, setDiscographyOrders] = useState<number[]>([])
  /** When `shows.discography_display`, `mm.dd.yy [venue]`; otherwise "". */
  const [discographySourceLabels, setDiscographySourceLabels] = useState<
    string[]
  >([])
  const [discographyShowColumnCells, setDiscographyShowColumnCells] = useState<
    (DiscographyShowColumnCell | null)[]
  >([])
  const [showContextById, setShowContextById] = useState<
    Record<string, DiscographyLinkedShowContext>
  >({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!discographyUuid || !supabase) {
      setSetlist([])
      setRowKeys([])
      setDiscographyOrders([])
      setDiscographySourceLabels([])
      setDiscographyShowColumnCells([])
      setShowContextById({})
      setLoading(false)
      setError(false)
      return
    }

    const client = supabase
    let cancelled = false

    async function run() {
      setLoading(true)
      setError(false)
      try {
        const { data: linkRows, error: linkErr } = await client
          .from("discography_entries")
          .select("uuid, setlist_entry, discography_entry, order")
          .eq("discography_entry", discographyUuid)

        if (cancelled) return
        if (linkErr) throw linkErr

        const links = sortLinks((linkRows ?? []) as DiscographyEntryLink[])
        if (links.length === 0) {
          setSetlist([])
          setRowKeys([])
          setDiscographyOrders([])
          setDiscographySourceLabels([])
          setDiscographyShowColumnCells([])
          setShowContextById({})
          setError(false)
          setLoading(false)
          return
        }

        const uniqueEntryIds = [...new Set(links.map((l) => l.setlist_entry))]

        const { data: rawEntries, error: entriesErr } = await client
          .from("setlist_entries")
          .select(SETLIST_ENTRY_DETAIL_SELECT)
          .in("entry_id", uniqueEntryIds)

        if (cancelled) return
        if (entriesErr) throw entriesErr

        const byId = new Map<string, SetlistEntry>()
        for (const row of rawEntries ?? []) {
          const mapped = mapSupabaseSetlistRowToEntry(
            row as Record<string, unknown>,
          )
          byId.set(mapped.entry_id, mapped)
        }

        const ordered: SetlistEntry[] = []
        const keys: string[] = []
        const orders: number[] = []
        for (const link of links) {
          const base = byId.get(link.setlist_entry)
          if (!base) continue
          ordered.push({ ...base })
          keys.push(link.uuid)
          orders.push(link.order)
        }

        const showIds = [...new Set(ordered.map((e) => e.entry_show))]
        const showsById = new Map<string, ShowDiscographyFields>()
        if (showIds.length > 0) {
          const { data: showRows, error: showErr } = await client
            .from("shows")
            .select(
              `
              show_id,
              show_date,
              show_venue_location,
              show_group,
              discography_display,
              show_subvenue_venue,
              subvenues:show_subvenue(
                venues:subvenue_venue(
                  venue_id
                )
              )
            `,
            )
            .in("show_id", showIds)
          if (showErr) throw showErr
          const ctx: Record<string, DiscographyLinkedShowContext> = {}
          for (const row of (showRows ?? []) as ShowDiscographyFields[]) {
            showsById.set(row.show_id, row)
            ctx[row.show_id] = {
              show_date: row.show_date,
              show_venue_location: row.show_venue_location,
              show_group: row.show_group,
            }
          }
          setShowContextById(ctx)
        } else {
          setShowContextById({})
        }

        const { labels: sourceLabels, cells: sourceCells } =
          buildDiscographySourceColumns(ordered, showsById)

        if (cancelled) return
        setSetlist(ordered)
        setRowKeys(keys)
        setDiscographyOrders(orders)
        setDiscographySourceLabels(sourceLabels)
        setDiscographyShowColumnCells(sourceCells)
        setError(false)
      } catch (e) {
        console.error("useDiscographyLinkedSetlist:", e)
        if (!cancelled) {
          setSetlist([])
          setRowKeys([])
          setDiscographyOrders([])
          setDiscographySourceLabels([])
          setDiscographyShowColumnCells([])
          setShowContextById({})
          setError(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [discographyUuid])

  return {
    setlist,
    rowKeys,
    discographyOrders,
    discographySourceLabels,
    discographyShowColumnCells,
    showContextById,
    loading,
    error,
  }
}
