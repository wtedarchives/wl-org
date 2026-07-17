/**
 * Deno Edge Function helpers: compute storable `wted_radio_ids.artwork` URLs using
 * Radio.co `artwork.large_url` first, then the same setlist → release chain as the
 * WTED request drawer (without reading the current DB `artwork` column for step 2).
 *
 * Keep algorithm aligned with:
 * - `lib/wted-radio-ids-sync.ts` (Radio.co large_url)
 * - `lib/wted-resolve-radio-request-context.ts`
 * - `lib/wted-entry-release-artwork-fetch.ts` (sem → releases_shows → releases)
 */
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

export const WTED_RADIO_CO_TRACKS_URL =
  "https://public.radio.co/stations/s3c11c85d6/requests/tracks" as const

const PAGE_SIZE = 1000
const RELEASE_IN_CHUNK = 200

type RadioCoTrack = {
  id: number
  artwork?: { large_url?: string | null } | null
}

type RadioCoApiResponse = { tracks: RadioCoTrack[] }

export async function fetchRadioCoLargeUrlByRadioId(): Promise<
  Map<string, string | null>
> {
  const res = await fetch(WTED_RADIO_CO_TRACKS_URL, { cache: "no-store" })
  if (!res.ok) throw new Error(`Radio.co returned ${res.status}`)
  const json = (await res.json()) as RadioCoApiResponse
  if (!Array.isArray(json.tracks)) {
    throw new Error("Invalid Radio.co response: missing tracks array")
  }
  const m = new Map<string, string | null>()
  for (const t of json.tracks) {
    const id = String(t.id)
    const raw = t.artwork?.large_url
    if (raw == null || typeof raw !== "string") {
      m.set(id, null)
      continue
    }
    const trimmed = raw.trim()
    m.set(id, trimmed === "" ? null : trimmed)
  }
  return m
}

export function normalizedArtworkUrl(value: unknown): string | null {
  if (value == null || typeof value !== "string") return null
  const t = value.trim()
  return t === "" ? null : t
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size))
  }
  return out
}

type RsRow = { release_id: string; release_order: number | null }

async function fetchReleasesOnShow(
  client: SupabaseClient,
  showId: string,
  releaseIds: string[],
): Promise<RsRow[]> {
  if (releaseIds.length === 0) return []
  const out: RsRow[] = []
  for (const rChunk of chunk(releaseIds, RELEASE_IN_CHUNK)) {
    let page = 0
    let more = true
    while (more) {
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const { data, error } = await client
        .from("releases_shows")
        .select("release_id, release_order")
        .eq("show_id", showId)
        .in("release_id", rChunk)
        .range(from, to)
      if (error) throw error
      const rows = (data ?? []) as RsRow[]
      out.push(...rows)
      more = rows.length === PAGE_SIZE
      page++
    }
  }
  return out
}

/** Every release on a show (no `release_id` filter) — for the show_id fallback. */
async function fetchAllReleasesOnShow(
  client: SupabaseClient,
  showId: string,
): Promise<RsRow[]> {
  const out: RsRow[] = []
  let page = 0
  let more = true
  while (more) {
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const { data, error } = await client
      .from("releases_shows")
      .select("release_id, release_order")
      .eq("show_id", showId)
      .range(from, to)
    if (error) throw error
    const rows = (data ?? []) as RsRow[]
    out.push(...rows)
    more = rows.length === PAGE_SIZE
    page++
  }
  return out
}

function mergeByReleaseIdMinOrder(rows: RsRow[]): RsRow[] {
  const m = new Map<string, RsRow>()
  for (const r of rows) {
    const prev = m.get(r.release_id)
    const o = r.release_order ?? Number.POSITIVE_INFINITY
    const po = prev?.release_order ?? Number.POSITIVE_INFINITY
    if (!prev || o < po) m.set(r.release_id, r)
  }
  return [...m.values()]
}

function pickLowestOrderAmongReleases(rows: RsRow[]): RsRow | null {
  const merged = mergeByReleaseIdMinOrder(rows)
  if (merged.length === 0) return null
  const scored = merged.map((r) => ({
    row: r,
    order: r.release_order ?? Number.POSITIVE_INFINITY,
  }))
  scored.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order
    return a.row.release_id.localeCompare(b.row.release_id)
  })
  return scored[0]!.row
}

/**
 * Release artwork from `setlist_entry_media` → `releases_shows` → `releases`
 * (same as drawer), without consulting `wted_radio_ids.artwork`.
 */
async function fetchReleaseArtworkFromSem(
  client: SupabaseClient,
  entryId: string,
  entryShow: string,
  fallbackReleaseArtwork: string | null,
): Promise<string | null> {
  const fb = normalizedArtworkUrl(fallbackReleaseArtwork)
  try {
    const { data: semRows, error: semErr } = await client
      .from("setlist_entry_media")
      .select("release_id")
      .eq("setlist_entry_id", entryId)

    if (semErr) throw semErr
    const releaseIds = [
      ...new Set(
        (semRows ?? []).map((r: { release_id: string }) => r.release_id),
      ),
    ]

    if (releaseIds.length === 0) return fb

    const onShow = await fetchReleasesOnShow(client, entryShow, releaseIds)

    const winner = pickLowestOrderAmongReleases(onShow)
    if (!winner) return fb

    const { data: rel, error: rErr } = await client
      .from("releases")
      .select("release_artwork")
      .eq("release_id", winner.release_id)
      .maybeSingle()

    if (rErr) throw rErr
    const art =
      (rel as { release_artwork: string | null } | null)?.release_artwork ??
      null
    return normalizedArtworkUrl(art) ?? fb
  } catch {
    return fb
  }
}

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

/** Matches `lib/map-supabase-setlist-entry-row.ts` — keep in sync. */
export const SETLIST_ENTRY_DETAIL_SELECT = `
  entry_id,
  entry_set,
  entry_setnum,
  entry_song,
  entry_short,
  entry_segue,
  entry_length,
  entry_placement,
  entry_coachnotes,
  entry_setorder,
  entry_show,
  radio_id,
  song_tour_count,
  last_count,
  last_show_id,
  last_show_tour,
  last_show_subvenue,
  last_venue,
  last_venue_location,
  last_show_date,
  times_played,
  shows_since_debut,
  song_rarity_percentage,
  times_played_num,
  shows_since_debut_num,
  songs (
    song_id,
    song,
    song_displayname,
    song_category,
    song_originalartist,
    categories (
      category_canonid
    )
  ),
  setlist_entry_guests(
    guest_id,
    guests(
      guest_displayname,
      guest_canonid,
      guest_instrument,
      guest_category
    )
  ),
  joty_results (
    round_achieved
  )
`

/** Matches `mapSupabaseSetlistRowToEntry` shape used by resolve (entry_id, entry_show, radio_id, …). */
export function mapSupabaseSetlistRowToEntry(
  entry: Record<string, unknown>,
): Record<string, unknown> {
  const songs = entry.songs as
    | {
        song_id: string
        song: string
        song_displayname: string | null
        song_category: string
        song_originalartist: string | null
        categories: { category_canonid: number }
      }
    | undefined
  const guestsRaw = entry.setlist_entry_guests as
    | Array<{
        guest_id: string
        guests: {
          guest_displayname: string
          guest_canonid: number
          guest_instrument: string
          guest_category?: string | null
        }
      }>
    | undefined
  const jotyResults = entry.joty_results as
    | { round_achieved: string | null }
    | undefined

  return {
    ...entry,
    song_id: songs?.song_id ?? "",
    song_category: songs?.song_category ?? "",
    category_canonid: songs?.categories?.category_canonid ?? 0,
    times_played_num:
      entry.times_played_num != null ? Number(entry.times_played_num) : null,
    shows_since_debut_num:
      entry.shows_since_debut_num != null
        ? Number(entry.shows_since_debut_num)
        : null,
    joty_round: jotyResults?.round_achieved ?? null,
    guests:
      guestsRaw?.map((g) => ({
        guest_id: g.guest_id,
        guest_display_name: g.guests.guest_displayname,
        guest_canonid: g.guests.guest_canonid,
        guest_instrument: g.guests.guest_instrument,
        guest_category: g.guests.guest_category ?? null,
      })) ?? [],
    songs: songs
      ? {
          ...songs,
          song: songs.song ?? "",
          song_displayname: songs.song_displayname ?? null,
          song_originalartist: songs.song_originalartist ?? null,
          categories: {
            category_canonid: songs.categories?.category_canonid ?? 0,
            category_artwork: null,
          },
        }
      : {
          song_id: "",
          song: "",
          song_displayname: null,
          song_category: "",
          song_originalartist: null,
          categories: { category_canonid: 0, category_artwork: null },
        },
  }
}

async function resolveWtedRequestFromRadioId(
  client: SupabaseClient,
  radioId: string,
  catalogArtwork: string | null,
): Promise<{
  entry: Record<string, unknown>
  fallbackReleaseArtwork: string | null
} | null> {
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

  const art =
    catalogArtwork != null && catalogArtwork.trim() !== "" ?
      catalogArtwork.trim()
    : null

  return {
    entry,
    fallbackReleaseArtwork: art,
  }
}

/** Show-level release artwork: the lowest-`release_order` release on a show. */
async function fetchShowLevelReleaseArtwork(
  client: SupabaseClient,
  showId: string,
): Promise<string | null> {
  const onShow = await fetchAllReleasesOnShow(client, showId)
  const winner = pickLowestOrderAmongReleases(onShow)
  if (!winner) return null
  const { data: rel, error } = await client
    .from("releases")
    .select("release_artwork")
    .eq("release_id", winner.release_id)
    .maybeSingle()
  if (error) throw error
  const art =
    (rel as { release_artwork: string | null } | null)?.release_artwork ?? null
  return normalizedArtworkUrl(art)
}

/** The catalog row's stored `show_id` for a radio_id (trimmed; null if unset). */
async function fetchShowIdForRadioId(
  client: SupabaseClient,
  radioId: string,
): Promise<string | null> {
  const { data, error } = await client
    .from("wted_radio_ids")
    .select("show_id")
    .eq("radio_id", radioId)
    .limit(1)
  if (error) throw error
  const showId = (data?.[0] as { show_id: string | null } | undefined)?.show_id
  return showId && showId.trim() !== "" ? showId.trim() : null
}

/**
 * Setlist → release artwork only (no Radio.co map). When a radio_id has setlist
 * entries, resolve via the entry-specific chain (drawer parity). When it has
 * NONE, fall back to the catalog row's `show_id` and use that show's lowest-order
 * release artwork.
 */
export async function computeReleaseArtworkOnly(
  client: SupabaseClient,
  radioId: string,
): Promise<string | null> {
  const rid = String(radioId ?? "").trim()
  if (!rid) return null
  try {
    const resolved = await resolveWtedRequestFromRadioId(client, rid, null)
    if (resolved) {
      const entryId = String(resolved.entry.entry_id ?? "")
      const entryShow = String(resolved.entry.entry_show ?? "")
      if (!entryId || !entryShow) return null
      return await fetchReleaseArtworkFromSem(
        client,
        entryId,
        entryShow,
        resolved.fallbackReleaseArtwork,
      )
    }
    // No setlist entries: fall back to the catalog row's show_id.
    const showId = await fetchShowIdForRadioId(client, rid)
    if (!showId) return null
    return await fetchShowLevelReleaseArtwork(client, showId)
  } catch {
    return null
  }
}

/**
 * Target URL to store on `wted_radio_ids.artwork`: Radio.co `large_url` when present,
 * otherwise release artwork from the drawer’s setlist anchor (no DB `artwork` read).
 */
export async function computeStorableArtworkUrl(
  client: SupabaseClient,
  radioId: string,
  apiLargeByRadioId: Map<string, string | null>,
): Promise<string | null> {
  const rid = String(radioId ?? "").trim()
  if (!rid) return null

  const fromApi = apiLargeByRadioId.has(rid) ?
      normalizedArtworkUrl(apiLargeByRadioId.get(rid))
    : null
  if (fromApi) return fromApi

  return computeReleaseArtworkOnly(client, rid)
}
