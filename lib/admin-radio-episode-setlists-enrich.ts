import type { SupabaseClient } from "@supabase/supabase-js"
import { mapSupabaseSetlistRowToEntry } from "@/lib/map-supabase-setlist-entry-row"
import { WTED_EPISODE_SETLIST_ENTRY_SELECT } from "@/lib/wted-episode-setlist-select"

const CHUNK = 500

export type AdminEpisodeSetlistTableRow = {
  eeUuid: string
  entryId: string
  entrySong: string
  songDisplayName: string | null
  showDateRaw: string | null
  venueLocation: string | null
  showGroup: string | null
  wtedSet: string | null
  wtedOrder: number | null
  wtedPlacement: string | null
}

function parseShowJoin(raw: Record<string, unknown>): {
  showDate: string | null
  venueLocation: string | null
  showGroup: string | null
} {
  const shows = raw.shows as
    | {
        show_date: string
        show_venue_location: string | null
        show_group: string | null
      }
    | null
    | undefined
  if (!shows) {
    return { showDate: null, venueLocation: null, showGroup: null }
  }
  return {
    showDate: shows.show_date ?? null,
    venueLocation: shows.show_venue_location ?? null,
    showGroup: shows.show_group ?? null,
  }
}

function sortLabel(song: string, songDisplayName: string | null): string {
  return (songDisplayName?.trim() || song).toLowerCase()
}

/** PostgREST/JSON may return `order` as string; keep aligned with draft numbers. */
function coerceWtedEpisodeOrder(val: unknown): number | null {
  if (val == null) return null
  if (typeof val === "number" && Number.isFinite(val)) return Math.trunc(val)
  if (typeof val === "string" && val.trim() !== "") {
    const n = Number.parseInt(val, 10)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function normalizeWtedEpisodeSet(val: unknown): string | null {
  if (val == null) return null
  const t = String(val).trim()
  return t !== "" ? t : null
}

function normalizeWtedEpisodePlacement(val: unknown): string | null {
  if (val == null) return null
  const t = String(val).trim()
  return t !== "" ? t : null
}

export function sortAdminEpisodeSetlistRows(
  rows: AdminEpisodeSetlistTableRow[],
): AdminEpisodeSetlistTableRow[] {
  return [...rows].sort((a, b) => {
    const setA = a.wtedSet ?? "\uffff"
    const setB = b.wtedSet ?? "\uffff"
    const c = setA.localeCompare(setB, undefined, { sensitivity: "base" })
    if (c !== 0) return c
    const oa = a.wtedOrder ?? 999999
    const ob = b.wtedOrder ?? 999999
    if (oa !== ob) return oa - ob
    return sortLabel(a.entrySong, a.songDisplayName).localeCompare(
      sortLabel(b.entrySong, b.songDisplayName),
    )
  })
}

export async function loadAdminEpisodeSetlistRows(
  client: SupabaseClient,
  radioId: string,
): Promise<AdminEpisodeSetlistTableRow[]> {
  const { data: epRows, error: eeErr } = await client
    .from("wted_episode_entries")
    .select("uuid, song, set, placement, order")
    .eq("episode", radioId)

  if (eeErr) throw eeErr
  if (!epRows?.length) return []

  const enrichedById = new Map<
    string,
    {
      entrySong: string
      songDisplayName: string | null
      showDateRaw: string | null
      venueLocation: string | null
      showGroup: string | null
    }
  >()

  const entryIds = epRows.map((e) => e.song).filter(Boolean)

  for (let i = 0; i < entryIds.length; i += CHUNK) {
    const chunk = entryIds.slice(i, i + CHUNK)
    const { data: slRows, error: slErr } = await client
      .from("setlist_entries")
      .select(WTED_EPISODE_SETLIST_ENTRY_SELECT)
      .in("entry_id", chunk)

    if (slErr) throw slErr
    for (const raw of (slRows ?? []) as unknown[]) {
      const rec = raw as Record<string, unknown>
      const meta = parseShowJoin(rec)
      const setlistEntry = mapSupabaseSetlistRowToEntry(rec)
      const songDisplay =
        setlistEntry.songs?.song_displayname != null &&
        setlistEntry.songs.song_displayname !== "" ?
          setlistEntry.songs.song_displayname
        : null
      enrichedById.set(setlistEntry.entry_id, {
        entrySong: setlistEntry.entry_song,
        songDisplayName: songDisplay,
        showDateRaw: meta.showDate,
        venueLocation: meta.venueLocation,
        showGroup: meta.showGroup,
      })
    }
  }

  const built: AdminEpisodeSetlistTableRow[] = []
  for (const ee of epRows) {
    const en = enrichedById.get(ee.song)
    built.push({
      eeUuid: ee.uuid,
      entryId: ee.song,
      entrySong: en?.entrySong ?? "(missing setlist row)",
      songDisplayName: en?.songDisplayName ?? null,
      showDateRaw: en?.showDateRaw ?? null,
      venueLocation: en?.venueLocation ?? null,
      showGroup: en?.showGroup ?? null,
      wtedSet: normalizeWtedEpisodeSet(ee.set),
      wtedOrder: coerceWtedEpisodeOrder(ee.order),
      wtedPlacement: normalizeWtedEpisodePlacement(ee.placement),
    })
  }

  return sortAdminEpisodeSetlistRows(built)
}
