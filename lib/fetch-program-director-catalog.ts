import type { SupabaseClient } from "@supabase/supabase-js"

import { compareWtedEpisodesByOrderThenDisplayName } from "@/lib/wted-episode-display-name"

const ENTRY_PAGE = 1000
const CHUNK = 500

export type ProgramDirectorCatalogEpisodeModalRow = {
  uuid: string
  show: string
  episode: string
  display_name: string | null
  artwork: string | null
  order: number | null
}

export type ProgramDirectorCatalogRow = {
  entryId: string
  entrySong: string
  entryShort: string | null
  songId: string | null
  songDisplayName: string | null
  categoryArtwork: string | null
  showGroup: string | null
  showDate: string | null
  venueLocation: string | null
  /** Venue name from `shows.show_subvenue` — filter/search only; not shown in the grid */
  showSubvenue: string | null
  /** Canonical show id for `/archive/setlist?id=` when present */
  showId: string | null
  /** Prefer nested venue UUID; else `shows.show_subvenue_venue` — same as tour rows */
  venueArchiveKey: string | null
  /** Count of `wted_episode_entries` rows for this setlist performance */
  wtedAppearancesCount: number
  episodes: ProgramDirectorCatalogEpisodeModalRow[]
}

type ResolvedWtedEpisode = {
  uuid: string
  episode: string
  display_name: string | null
  show: string
  artwork: string | null
  status: string | null
  radio_id: string | null
  order: number | null
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size))
  }
  return out
}

function uniquePreserveStrings(arr: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const x of arr) {
    const k = String(x)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(x)
  }
  return out
}

function pickNestedOne<T extends Record<string, unknown>>(
  raw: unknown,
): T | null {
  if (raw == null) return null
  if (Array.isArray(raw)) {
    const first = raw[0]
    return first && typeof first === "object" ? (first as T) : null
  }
  return typeof raw === "object" ? (raw as T) : null
}

async function fetchAllWtedEpisodeEntrySongEpisodePairs(
  client: SupabaseClient,
): Promise<{ song: string; episode: string }[]> {
  const rows: { song: string; episode: string }[] = []
  let from = 0
  for (;;) {
    const { data, error } = await client
      .from("wted_episode_entries")
      .select("song, episode")
      .range(from, from + ENTRY_PAGE - 1)
    if (error) throw error
    if (!data?.length) break
    for (const r of data as { song?: string; episode?: string }[]) {
      if (r.song && r.episode) {
        rows.push({ song: String(r.song), episode: String(r.episode) })
      }
    }
    if (data.length < ENTRY_PAGE) break
    from += ENTRY_PAGE
  }
  return rows
}

async function resolveWtedEpisodesByKeys(
  client: SupabaseClient,
  keys: string[],
): Promise<Map<string, ResolvedWtedEpisode>> {
  const episodeByKey = new Map<string, ResolvedWtedEpisode>()

  const remember = (r: ResolvedWtedEpisode) => {
    if (r.radio_id != null && String(r.radio_id).trim() !== "") {
      episodeByKey.set(String(r.radio_id), r)
    }
    episodeByKey.set(String(r.uuid), r)
  }

  const distinctKeys = [...new Set(keys.map((k) => String(k)))]

  for (const ids of chunk(distinctKeys, CHUNK)) {
    if (ids.length === 0) continue
    const { data, error } = await client
      .from("wted_episodes")
      .select(
        "uuid, episode, display_name, show, artwork, status, radio_id, order",
      )
      .in("radio_id", ids)
    if (error) throw error
    for (const row of data ?? []) {
      remember(row as ResolvedWtedEpisode)
    }
  }

  const unresolved = distinctKeys.filter((id) => !episodeByKey.has(id))
  for (const ids of chunk(unresolved, CHUNK)) {
    if (ids.length === 0) continue
    const { data, error } = await client
      .from("wted_episodes")
      .select(
        "uuid, episode, display_name, show, artwork, status, radio_id, order",
      )
      .in("uuid", ids)
    if (error) throw error
    for (const row of data ?? []) {
      remember(row as ResolvedWtedEpisode)
    }
  }

  return episodeByKey
}

const CATALOG_SETLIST_SELECT = `
  entry_id,
  entry_song,
  entry_short,
  songs (
    song_id,
    song_displayname,
    categories ( category_artwork )
  ),
  shows (
    show_id,
    show_group,
    show_date,
    show_venue_location,
    discography_display,
    show_subvenue,
    show_subvenue_venue,
    subvenues:show_subvenue (
      venues:subvenue_venue (
        venue_id
      )
    )
  )
`

function venueArchiveKeyFromShowEmbed(showRel: {
  show_subvenue_venue?: string | null
  subvenues?: unknown
}): string | null {
  const subvenuesVal = showRel.subvenues
  const nestedId =
    Array.isArray(subvenuesVal) ?
      (
        subvenuesVal[0] as { venues?: { venue_id?: string | null } } | undefined
      )?.venues?.venue_id
    : (
        subvenuesVal as { venues?: { venue_id?: string | null } } | undefined
      )?.venues?.venue_id
  if (nestedId != null && String(nestedId).trim() !== "") {
    return String(nestedId).trim()
  }
  const slug = showRel.show_subvenue_venue
  if (slug != null && String(slug).trim() !== "") return String(slug).trim()
  return null
}

async function fetchSetlistRowsForEntryIds(
  client: SupabaseClient,
  entryIds: string[],
): Promise<Map<string, Record<string, unknown>>> {
  const map = new Map<string, Record<string, unknown>>()
  for (const ids of chunk(entryIds, CHUNK)) {
    if (ids.length === 0) continue
    const { data, error } = await client
      .from("setlist_entries")
      .select(CATALOG_SETLIST_SELECT)
      .in("entry_id", ids)
    if (error) throw error
    for (const raw of (data ?? []) as Record<string, unknown>[]) {
      const id = raw.entry_id as string | undefined
      if (id) map.set(id, raw)
    }
  }
  return map
}

function buildEpisodesForEntry(
  episodeRefs: string[],
  episodeByKey: Map<string, ResolvedWtedEpisode>,
): ProgramDirectorCatalogEpisodeModalRow[] {
  const seenUuid = new Set<string>()
  const out: ProgramDirectorCatalogEpisodeModalRow[] = []
  for (const ref of uniquePreserveStrings(episodeRefs)) {
    const ep = episodeByKey.get(String(ref))
    if (!ep || ep.status === "skipped") continue
    if (seenUuid.has(ep.uuid)) continue
    seenUuid.add(ep.uuid)
    out.push({
      uuid: ep.uuid,
      show: ep.show,
      episode: ep.episode,
      display_name: ep.display_name,
      artwork: ep.artwork,
      order: ep.order,
    })
  }
  out.sort((a, b) => {
    const byShow = a.show.localeCompare(b.show, undefined, {
      sensitivity: "base",
    })
    if (byShow !== 0) return byShow
    return compareWtedEpisodesByOrderThenDisplayName(a, b)
  })
  return out
}

function catalogEntryRawSortCompare(
  rawA: Record<string, unknown>,
  rawB: Record<string, unknown>,
): number {
  const songCmp = String(rawA.entry_song ?? "").localeCompare(
    String(rawB.entry_song ?? ""),
    undefined,
    { sensitivity: "base" },
  )
  if (songCmp !== 0) return songCmp
  const showA = pickNestedOne<{ show_date?: string | null }>(rawA.shows)
  const showB = pickNestedOne<{ show_date?: string | null }>(rawB.shows)
  const da =
    showA?.show_date != null ?
      String(showA.show_date).trim() || null
    : null
  const db =
    showB?.show_date != null ?
      String(showB.show_date).trim() || null
    : null
  return catalogRowSortKey(da) - catalogRowSortKey(db)
}

function catalogRowSortKey(showDate: string | null): number {
  if (!showDate) return 0
  const d = new Date(
    showDate.includes("T") ? showDate : showDate + "T00:00:00Z",
  ).getTime()
  return Number.isNaN(d) ? 0 : d
}

/**
 * One row per distinct `wted_episode_entries.song` (setlist `entry_id`).
 */
export async function fetchProgramDirectorCatalogRows(
  client: SupabaseClient,
): Promise<ProgramDirectorCatalogRow[]> {
  const pairs = await fetchAllWtedEpisodeEntrySongEpisodePairs(client)
  if (pairs.length === 0) return []

  const countByEntry = new Map<string, number>()
  const episodeRefsByEntry = new Map<string, string[]>()

  for (const { song, episode } of pairs) {
    countByEntry.set(song, (countByEntry.get(song) ?? 0) + 1)
    const list = episodeRefsByEntry.get(song) ?? []
    list.push(episode)
    episodeRefsByEntry.set(song, list)
  }

  const entryIds = [...countByEntry.keys()]
  const allEpisodeKeys = pairs.map((p) => p.episode)
  const episodeByKey = await resolveWtedEpisodesByKeys(client, allEpisodeKeys)
  const setlistByEntry = await fetchSetlistRowsForEntryIds(client, entryIds)

  entryIds.sort((idA, idB) => {
    const rawA = setlistByEntry.get(idA)
    const rawB = setlistByEntry.get(idB)
    if (!rawA || !rawB) return 0
    return catalogEntryRawSortCompare(rawA, rawB)
  })

  const rows: ProgramDirectorCatalogRow[] = []

  for (const entryId of entryIds) {
    const raw = setlistByEntry.get(entryId)
    if (!raw) continue

    const songRel = pickNestedOne<{
      song_id?: string
      song_displayname?: string | null
      categories?: { category_artwork?: string | null } | null
    }>(raw.songs)

    const showRel = pickNestedOne<{
      show_id?: string | null
      show_group?: string | null
      show_date?: string | null
      show_venue_location?: string | null
      discography_display?: boolean | null
      show_subvenue?: string | null
      show_subvenue_venue?: string | null
      subvenues?: unknown
    }>(raw.shows)

    const catArt = songRel?.categories?.category_artwork?.trim() ?? ""
    const venue = showRel?.show_venue_location?.trim() ?? ""
    const subvenueRaw = showRel?.show_subvenue
    const showIdRaw = showRel?.show_id
    const showId =
      showIdRaw != null && String(showIdRaw).trim() !== "" ?
        String(showIdRaw).trim()
      : null
    const venueArchiveKey =
      showRel ? venueArchiveKeyFromShowEmbed(showRel) : null
    const showSubvenue =
      subvenueRaw != null && String(subvenueRaw).trim() !== "" ?
        String(subvenueRaw).trim()
      : null

    const showDateVal =
      showRel?.show_date != null ?
        String(showRel.show_date).trim() || null
      : null

    const hideDiscographyDetails = showRel?.discography_display === false

    rows.push({
      entryId,
      entrySong: String(raw.entry_song ?? ""),
      entryShort:
        raw.entry_short != null && String(raw.entry_short).trim() !== "" ?
          String(raw.entry_short).trim()
        : null,
      songId:
        songRel?.song_id != null && String(songRel.song_id).trim() !== "" ?
          String(songRel.song_id)
        : null,
      songDisplayName:
        songRel?.song_displayname != null &&
        String(songRel.song_displayname).trim() !== "" ?
          String(songRel.song_displayname).trim()
        : null,
      categoryArtwork: catArt.length > 0 ? catArt : null,
      showGroup:
        showRel?.show_group != null && String(showRel.show_group).trim() !== "" ?
          String(showRel.show_group).trim()
        : null,
      showDate: hideDiscographyDetails ? null : showDateVal,
      venueLocation:
        hideDiscographyDetails ? null
        : venue.length > 0 ?
          venue
        : null,
      showSubvenue,
      showId: hideDiscographyDetails ? null : showId,
      venueArchiveKey:
        hideDiscographyDetails ? null : venueArchiveKey,
      wtedAppearancesCount: countByEntry.get(entryId) ?? 0,
      episodes: buildEpisodesForEntry(
        episodeRefsByEntry.get(entryId) ?? [],
        episodeByKey,
      ),
    })
  }

  return rows
}
