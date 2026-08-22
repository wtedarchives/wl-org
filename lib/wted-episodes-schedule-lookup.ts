import type { RadioScheduleEvent } from "@/lib/radio-schedule-day-slots"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { formatSetlistDate } from "@/lib/setlist-utils"
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
  /**
   * When `show_link` resolves to a `shows` row:
   * `mm.dd.yy · group · detail · location · venue` (empty parts omitted).
   * Takes precedence over show/display_name for the schedule title.
   */
  linkedShowTitle: string | null
}

/** NBSP padding so HTML does not collapse double spaces around the bullet. */
const SCHEDULE_TITLE_DIVIDER = "\u00a0\u00a0·\u00a0\u00a0"

/** Bucket shows where the schedule title is `display_name` only (no show prefix). */
const SCHEDULE_TITLE_DISPLAY_NAME_ONLY_SHOWS = new Set([
  "Miscellaneous",
  "Show Airings",
  "requesTED",
  "Mixes",
])

function joinScheduleTitleParts(
  parts: Array<string | null | undefined>,
): string | null {
  const cleaned = parts
    .map((p) => (p ?? "").trim())
    .filter((p) => p.length > 0)
  return cleaned.length > 0 ? cleaned.join(SCHEDULE_TITLE_DIVIDER) : null
}

/** `mm.dd.yy · show_group · show_detail · show_venue_location · show_subvenue` (empty parts omitted). */
export function formatLinkedShowScheduleTitle(show: {
  show_date: string | null
  show_group: string | null
  show_detail: string | null
  show_venue_location: string | null
  show_subvenue: string | null
}): string | null {
  return joinScheduleTitleParts([
    formatSetlistDate(show.show_date),
    show.show_group,
    show.show_detail,
    scheduleVenuePart(show.show_venue_location),
    scheduleVenuePart(show.show_subvenue),
  ])
}

/** Drop venue fields that contain "Unknown" (case-insensitive) anywhere. */
function scheduleVenuePart(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim()
  if (!trimmed) return null
  if (/unknown/i.test(trimmed)) return null
  return trimmed
}

/**
 * Title for a schedule row from a matched `wted_episodes` row.
 * Prefer linked-show title when `show_link` resolved; else `show · display_name`
 * (Miscellaneous / Show Airings / requesTED / Mixes → `display_name` only).
 */
export function formatWtedEpisodeScheduleTitle(
  episode: Pick<
    WtedEpisodeScheduleLookup,
    "show" | "display_name" | "linkedShowTitle"
  >,
): string | null {
  const linked = episode.linkedShowTitle?.trim()
  if (linked) return linked

  const show = episode.show?.trim() ?? ""
  const displayName = episode.display_name?.trim() ?? ""

  if (SCHEDULE_TITLE_DISPLAY_NAME_ONLY_SHOWS.has(show)) {
    return displayName || null
  }

  if (show && displayName) {
    return joinScheduleTitleParts([show, displayName])
  }
  return displayName || show || null
}

/**
 * Header-player second subtext from the on-air schedule episode.
 * Same title rules as Upcoming Schedule except linked-show archive titles:
 * `show · display_name`, with Miscellaneous / requesTED / Mixes showing
 * `display_name` only. Show Airings is omitted — the track line already
 * carries date/venue, so a second slide would be near-duplicate.
 */
export function formatOnAirEpisodeSubtext(
  episode:
    | Pick<WtedEpisodeScheduleLookup, "show" | "display_name">
    | null
    | undefined,
): string | null {
  if (!episode) return null
  if (episode.show?.trim() === "Show Airings") return null
  return formatWtedEpisodeScheduleTitle({
    show: episode.show,
    display_name: episode.display_name,
    linkedShowTitle: null,
  })
}

/**
 * Prefer matched `wted_episodes` title; fall back to Radio.co playlist name/title.
 */
export function resolveRadioScheduleSlotTitle(
  event: RadioScheduleEvent,
  wtedEpisode: WtedEpisodeScheduleLookup | null | undefined,
): string {
  if (wtedEpisode) {
    const fromDb = formatWtedEpisodeScheduleTitle(wtedEpisode)
    if (fromDb) return fromDb
  }
  return (
    event.playlist.name?.trim() ||
    event.playlist.title?.trim() ||
    ""
  )
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

type ScheduleLinkedShowRow = {
  show_date: string | null
  show_group: string | null
  show_detail: string | null
  show_venue_location: string | null
  show_subvenue: string | null
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

async function fetchShowsForScheduleTitles(
  showIds: string[],
): Promise<Map<string, ScheduleLinkedShowRow>> {
  const map = new Map<string, ScheduleLinkedShowRow>()
  if (!supabase) return map

  const unique = [
    ...new Set(
      showIds
        .map((id) => id.trim())
        .filter((id) => id.length > 0),
    ),
  ]
  if (unique.length === 0) return map

  for (let i = 0; i < unique.length; i += IN_CHUNK) {
    const chunk = unique.slice(i, i + IN_CHUNK)
    const { data, error } = await supabase
      .from("shows")
      .select(
        "show_id, show_date, show_group, show_detail, show_venue_location, show_subvenue",
      )
      .in("show_id", chunk)

    if (error) continue

    for (const row of data ?? []) {
      const id =
        typeof row.show_id === "string" ? row.show_id.trim()
        : row.show_id != null ? String(row.show_id).trim()
        : ""
      if (!id || map.has(id)) continue
      map.set(id, {
        show_date:
          row.show_date === null || row.show_date === undefined ?
            null
          : String(row.show_date),
        show_group:
          row.show_group === null || row.show_group === undefined ?
            null
          : String(row.show_group),
        show_detail:
          row.show_detail === null || row.show_detail === undefined ?
            null
          : String(row.show_detail),
        show_venue_location:
          row.show_venue_location === null ||
          row.show_venue_location === undefined ?
            null
          : String(row.show_venue_location),
        show_subvenue:
          row.show_subvenue === null || row.show_subvenue === undefined ?
            null
          : String(row.show_subvenue),
      })
    }
  }

  return map
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
  showsById: Map<string, ScheduleLinkedShowRow>,
): WtedEpisodeScheduleLookup {
  const linkedShow =
    row.show_link ? (showsById.get(row.show_link) ?? null) : null
  return {
    show: row.show,
    display_name: row.display_name,
    artwork: row.artwork,
    host: row.host,
    scheduleLinkHref: resolveWtedEpisodeScheduleLinkHref(
      row,
      radioIdsWithEntries,
    ),
    linkedShowTitle:
      linkedShow ? formatLinkedShowScheduleTitle(linkedShow) : null,
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

  const showLinks = resolvedRows
    .map((row) => row?.show_link)
    .filter((id): id is string => Boolean(id))
  const showsById = await fetchShowsForScheduleTitles(showLinks)

  return slots.map((s, index) => {
    const row = resolvedRows[index] ?? null
    const wtedEpisode =
      row ?
        toPublicWtedEpisodeScheduleLookup(
          row,
          radioIdsWithEntries,
          showsById,
        )
      : null
    return { ...s, wtedEpisode }
  })
}
