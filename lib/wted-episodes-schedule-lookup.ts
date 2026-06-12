import type { RadioScheduleEvent } from "@/lib/radio-schedule-day-slots"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { supabase } from "@/lib/supabase"
import { getWtedEpisodeUrl } from "@/lib/wted-episode-url"

/**
 * Radio.co album-art URLs embed the playlist id: `.../playlist.{radio_id}.{revision}.{stamp}.{ext}`.
 * Used when `playlist.name` ↔ `wted_episodes.episode` anon lookup misses (e.g. RLS on `skipped` rows).
 */
export function extractRadioCoPlaylistIdFromArtworkUrl(url: string): string | null {
  const u = url.trim()
  if (!u) return null
  const m = u.match(/\/playlist\.(\d+)\./)
  return m?.[1] ?? null
}

/** Subset of `wted_episodes` joined to Radio.co `playlist.name` (= `episode`). */
export type WtedEpisodeScheduleLookup = {
  show: string
  display_name: string | null
  artwork: string | null
  /** JSONB array of `{ name, handle }` — see `parseWtedEpisodeHosts`. */
  host: unknown
  /**
   * When set, the schedule row should link to a WTED episode page or Setlist Archive show.
   * Episode page when `wted_episode_entries` exist for `radio_id`; else `show_link` setlist.
   */
  scheduleLinkHref: string | null
}

type WtedEpisodeScheduleLookupRow = {
  show: string
  display_name: string | null
  artwork: string | null
  host: unknown
  uuid: string
  radio_id: string | null
  show_link: string | null
}

const IN_CHUNK = 120

function normalizeRadioId(
  radioId: string | number | null | undefined,
): string | null {
  if (radioId === null || radioId === undefined) return null
  const rid = String(radioId).trim()
  return rid.length > 0 ? rid : null
}

function normalizeShowLink(
  showLink: string | null | undefined,
): string | null {
  if (showLink == null) return null
  const id = String(showLink).trim()
  return id.length > 0 ? id : null
}

function mapWtedEpisodeScheduleRow(
  row: Record<string, unknown>,
): WtedEpisodeScheduleLookupRow | null {
  const ep = typeof row.episode === "string" ? row.episode.trim() : ""
  if (!ep) return null
  if (row.status === "REMOVED") return null
  const uuid = typeof row.uuid === "string" ? row.uuid.trim() : ""
  if (!uuid) return null
  return {
    show: String(row.show ?? ""),
    display_name:
      row.display_name === null || row.display_name === undefined ?
        null
      : String(row.display_name),
    artwork:
      row.artwork === null || row.artwork === undefined ?
        null
      : String(row.artwork),
    host: row.host,
    uuid,
    radio_id: normalizeRadioId(row.radio_id as string | number | null),
    show_link: normalizeShowLink(row.show_link as string | null),
  }
}

/** `wted_episode_entries.episode` values (= `wted_episodes.radio_id`) with at least one row. */
async function fetchRadioIdsWithEpisodeEntries(
  radioIds: string[],
): Promise<Set<string>> {
  const withEntries = new Set<string>()
  if (!supabase) return withEntries

  const unique = [
    ...new Set(
      radioIds
        .map((id) => id.trim())
        .filter((id) => id.length > 0),
    ),
  ]
  if (unique.length === 0) return withEntries

  for (let i = 0; i < unique.length; i += IN_CHUNK) {
    const chunk = unique.slice(i, i + IN_CHUNK)
    const { data, error } = await supabase
      .from("wted_episode_entries")
      .select("episode")
      .in("episode", chunk)

    if (error) continue

    for (const row of data ?? []) {
      if (row.episode) withEntries.add(String(row.episode).trim())
    }
  }

  return withEntries
}

function resolveWtedEpisodeScheduleLinkHref(
  row: WtedEpisodeScheduleLookupRow,
  radioIdsWithEntries: Set<string>,
): string | null {
  if (row.radio_id && radioIdsWithEntries.has(row.radio_id)) {
    return getWtedEpisodeUrl(row.uuid)
  }
  if (row.show_link) {
    return getSetlistArchiveUrl(row.show_link)
  }
  return null
}

function toPublicWtedEpisodeScheduleLookup(
  row: WtedEpisodeScheduleLookupRow,
  radioIdsWithEntries: Set<string>,
): WtedEpisodeScheduleLookup {
  return {
    show: row.show,
    display_name: row.display_name,
    artwork: row.artwork,
    host: row.host,
    scheduleLinkHref: resolveWtedEpisodeScheduleLinkHref(
      row,
      radioIdsWithEntries,
    ),
  }
}

/**
 * Load `wted_episodes` rows keyed by `episode` (exact match on playlist name).
 * Omits `REMOVED` only. `skipped` is still used so Radio.co schedule rows can resolve
 * to show / display_name / artwork even when an episode is hidden from Program Director.
 */
export async function fetchWtedEpisodeScheduleLookupsByNames(
  episodeNames: string[],
): Promise<Map<string, WtedEpisodeScheduleLookupRow>> {
  const map = new Map<string, WtedEpisodeScheduleLookupRow>()
  if (!supabase) return map

  const unique = [
    ...new Set(
      episodeNames
        .map((n) => n.trim())
        .filter((n) => n.length > 0),
    ),
  ]
  if (unique.length === 0) return map

  for (let i = 0; i < unique.length; i += IN_CHUNK) {
    const chunk = unique.slice(i, i + IN_CHUNK)
    const { data, error } = await supabase
      .from("wted_episodes")
      .select(
        "episode, show, display_name, artwork, host, status, uuid, radio_id, show_link",
      )
      .in("episode", chunk)

    if (error) {
      continue
    }

    for (const row of data ?? []) {
      const ep = row.episode?.trim()
      if (!ep || map.has(ep)) continue
      const mapped = mapWtedEpisodeScheduleRow(row)
      if (mapped) map.set(ep, mapped)
    }
  }

  return map
}

/**
 * Same row shape as {@link fetchWtedEpisodeScheduleLookupsByNames}, keyed by `radio_id` string.
 * Omits `REMOVED` only.
 */
export async function fetchWtedEpisodeScheduleLookupsByRadioIds(
  radioIds: string[],
): Promise<Map<string, WtedEpisodeScheduleLookupRow>> {
  const map = new Map<string, WtedEpisodeScheduleLookupRow>()
  if (!supabase) return map

  const unique = [
    ...new Set(
      radioIds
        .map((id) => id.trim())
        .filter((id) => id.length > 0 && /^\d+$/.test(id)),
    ),
  ]
  if (unique.length === 0) return map

  for (let i = 0; i < unique.length; i += IN_CHUNK) {
    const chunk = unique.slice(i, i + IN_CHUNK)
    const { data, error } = await supabase
      .from("wted_episodes")
      .select(
        "episode, show, display_name, artwork, host, status, uuid, radio_id, show_link",
      )
      .in("radio_id", chunk)

    if (error) {
      continue
    }

    for (const row of data ?? []) {
      const rid = normalizeRadioId(row.radio_id)
      if (!rid || map.has(rid)) continue
      const mapped = mapWtedEpisodeScheduleRow(row)
      if (mapped) map.set(rid, mapped)
    }
  }

  return map
}

/**
 * Join Radio.co schedule rows to `wted_episodes` via `playlist.name` (= `episode`),
 * with `radio_id` parsed from Radio.co artwork URL as fallback.
 */
export async function attachWtedEpisodesToSlots<
  T extends { event: RadioScheduleEvent },
>(
  slots: T[],
): Promise<Array<T & { wtedEpisode: WtedEpisodeScheduleLookup | null }>> {
  if (slots.length === 0) return []

  const episodeKeys = slots.map((s) => s.event.playlist.name?.trim() ?? "")
  const episodeMap = await fetchWtedEpisodeScheduleLookupsByNames(episodeKeys)

  const radioIdsFromArtwork = slots
    .map((s) =>
      extractRadioCoPlaylistIdFromArtworkUrl(s.event.playlist.artwork ?? ""),
    )
    .filter((id): id is string => Boolean(id))
  const uniqueRadioIds = [...new Set(radioIdsFromArtwork)]

  const radioMap =
    await fetchWtedEpisodeScheduleLookupsByRadioIds(uniqueRadioIds)

  const resolvedRows = slots.map((s) => {
    const key = s.event.playlist.name?.trim()
    const byEpisode = key ? (episodeMap.get(key) ?? null) : null
    const rid = extractRadioCoPlaylistIdFromArtworkUrl(
      s.event.playlist.artwork ?? "",
    )
    const byRadioId =
      byEpisode ? null : (rid ? (radioMap.get(rid) ?? null) : null)
    return byEpisode ?? byRadioId ?? null
  })

  const radioIdsForEntryCheck = resolvedRows
    .map((row) => row?.radio_id)
    .filter((rid): rid is string => Boolean(rid))
  const radioIdsWithEntries = await fetchRadioIdsWithEpisodeEntries(
    radioIdsForEntryCheck,
  )

  return slots.map((s, index) => {
    const row = resolvedRows[index] ?? null
    const wtedEpisode =
      row ?
        toPublicWtedEpisodeScheduleLookup(row, radioIdsWithEntries)
      : null
    return { ...s, wtedEpisode }
  })
}
