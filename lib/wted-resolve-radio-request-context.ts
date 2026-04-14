import type { SupabaseClient } from "@supabase/supabase-js"

import {
  mapSupabaseSetlistRowToEntry,
  SETLIST_ENTRY_DETAIL_SELECT,
} from "@/lib/map-supabase-setlist-entry-row"
import type { SetlistEntry } from "@/types/setlist"

const PAGE_SIZE = 1000

function compareEntrySetOrder(
  a: { entry_set: string; entry_setnum: number },
  b: { entry_set: string; entry_setnum: number },
): number {
  const setCmp = String(a.entry_set).localeCompare(String(b.entry_set), undefined, {
    numeric: true,
  })
  if (setCmp !== 0) return setCmp
  return a.entry_setnum - b.entry_setnum
}

function showDateTs(showDate: string): number {
  const s = showDate.trim()
  if (!s) return Number.NEGATIVE_INFINITY
  const d = new Date(s.includes("T") ? s : `${s}T00:00:00Z`)
  const t = d.getTime()
  return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t
}

export type WtedRequestDrawerShowSlice = {
  show_date: string
  show_venue_location: string | null
  show_group: string | null
}

export type WtedRadioRequestResolved = {
  entry: SetlistEntry
  setlist: SetlistEntry[]
  show: WtedRequestDrawerShowSlice
  fallbackReleaseArtwork: string | null
}

/**
 * Finds setlist context for a catalog `radio_id`: picks the **most recent** show
 * that contains that id, loads the full setlist for that show, and anchors on the
 * first setlist row (set / setnum order) with that `radio_id` so medley grouping
 * matches setlist pages.
 */
export async function resolveWtedRequestFromRadioId(
  client: SupabaseClient,
  radioId: string,
  catalogArtwork: string | null,
): Promise<WtedRadioRequestResolved | null> {
  const rid = String(radioId ?? "").trim()
  if (!rid) return null

  const matches: Array<{
    entry_id: string
    entry_show: string
    entry_set: string
    entry_setnum: number
  }> = []

  let from = 0
  for (;;) {
    const { data, error } = await client
      .from("setlist_entries")
      .select("entry_id, entry_show, entry_set, entry_setnum")
      .eq("radio_id", rid)
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    const chunk = (data ?? []) as typeof matches
    matches.push(...chunk)
    if (chunk.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  if (matches.length === 0) return null

  const showIds = [...new Set(matches.map((m) => m.entry_show))]

  const { data: showsRaw, error: showErr } = await client
    .from("shows")
    .select("show_id, show_date, show_venue_location, show_group")
    .in("show_id", showIds)

  if (showErr) throw showErr

  const shows = (showsRaw ?? []) as Array<{
    show_id: string
    show_date: string
    show_venue_location: string | null
    show_group: string | null
  }>
  const showById = new Map(shows.map((s) => [s.show_id, s]))

  let bestShowId: string | null = null
  let bestTs = Number.NEGATIVE_INFINITY
  for (const sid of showIds) {
    const sh = showById.get(sid)
    const ts = sh ? showDateTs(sh.show_date) : Number.NEGATIVE_INFINITY
    if (
      ts > bestTs ||
      (ts === bestTs && sid > (bestShowId ?? ""))
    ) {
      bestTs = ts
      bestShowId = sid
    }
  }

  if (!bestShowId) return null

  const inShow = matches.filter((m) => m.entry_show === bestShowId)
  inShow.sort(compareEntrySetOrder)
  const anchorEntryId = inShow[0]?.entry_id
  if (!anchorEntryId) return null

  const fullRows: Record<string, unknown>[] = []
  from = 0
  for (;;) {
    const { data, error } = await client
      .from("setlist_entries")
      .select(SETLIST_ENTRY_DETAIL_SELECT)
      .eq("entry_show", bestShowId)
      .order("entry_set", { ascending: true })
      .order("entry_setnum", { ascending: true })
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    const chunk = data ?? []
    fullRows.push(...chunk)
    if (chunk.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  const setlist = fullRows.map((row) => mapSupabaseSetlistRowToEntry(row))
  const entry = setlist.find((e) => e.entry_id === anchorEntryId)
  if (!entry) return null

  const sh = showById.get(bestShowId)
  if (!sh) return null

  const art =
    catalogArtwork != null && catalogArtwork.trim() !== "" ?
      catalogArtwork.trim()
    : null

  return {
    entry,
    setlist,
    show: {
      show_date: sh.show_date ?? "",
      show_venue_location: sh.show_venue_location ?? null,
      show_group: sh.show_group ?? null,
    },
    fallbackReleaseArtwork: art,
  }
}
