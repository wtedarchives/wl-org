/**
 * Database lookups the TRMNL payload needs, shared by both runtimes.
 *
 * `payload.ts` is pure and knows nothing about a database, but two things on
 * the screen come from one: the schedule's display titles (`wted_episodes`,
 * exactly as the homepage resolves them) and the cover for the track on air
 * (the header player's chain). Both rules live here so the edge function and
 * the dev preview cannot drift.
 *
 * Runtime-agnostic by construction: instead of a Supabase client — which is a
 * different package in Deno and in Next — callers pass a {@link TrmnlFetchRows}
 * adapter over whichever client they already have.
 */
import {
  formatEpisodeScheduleTitle,
  formatLinkedShowScheduleTitle,
} from "../schedule-title.ts"
import type { TrmnlScheduleSlot } from "./payload.ts"

/** `select <columns> from <table> where <filterColumn> in (<values>)`. */
export type TrmnlFetchRows = (
  table: string,
  columns: string,
  filterColumn: string,
  values: string[],
) => Promise<Array<Record<string, unknown>>>

/** PostgREST `in()` list size, matching `IN_CHUNK` in the web lookup. */
const CHUNK = 120

function nonEmpty(value: unknown): string | null {
  if (value == null) return null
  const trimmed = String(value).trim()
  return trimmed ? trimmed : null
}

/**
 * PostgREST returns a to-one embed as an object, but generated types widen
 * every embed to an array. Accept both.
 */
function firstRelated(value: unknown): Record<string, unknown> | null {
  if (value == null) return null
  if (Array.isArray(value)) return (value[0] as Record<string, unknown>) ?? null
  return value as Record<string, unknown>
}

async function fetchChunked(
  fetchRows: TrmnlFetchRows,
  table: string,
  columns: string,
  filterColumn: string,
  values: string[],
): Promise<Array<Record<string, unknown>>> {
  const unique = [...new Set(values.map((v) => v.trim()).filter(Boolean))]
  if (unique.length === 0) return []

  const out: Array<Record<string, unknown>> = []
  for (let i = 0; i < unique.length; i += CHUNK) {
    try {
      out.push(
        ...(await fetchRows(table, columns, filterColumn, unique.slice(i, i + CHUNK))),
      )
    } catch {
      // A failed lookup degrades to the Radio.co label or no artwork, which is
      // the same thing the site does. It must never blank the whole screen.
    }
  }
  return out
}

/**
 * Radio.co album-art paths.
 *
 * `playlist.{id}` is the airing playlist; a bare numeric stem is the track id.
 * Both live under `images.radio.co/album_art/{station}/`, so the `playlist.`
 * marker is the only thing separating them — test for it first.
 */
const PLAYLIST_ARTWORK_RE = /\/playlist\.(\d+)\./
const TRACK_ARTWORK_RE = /\/(\d+)\.\d+\.\d+\.[a-z]+(?:\?|$)/i

export type ArtworkRef =
  | { kind: "playlist"; id: string }
  | { kind: "track"; id: string }
  | null

export function parseRadioCoArtworkUrl(url: string | null | undefined): ArtworkRef {
  const u = url?.trim()
  if (!u) return null
  const playlist = PLAYLIST_ARTWORK_RE.exec(u)
  if (playlist) return { kind: "playlist", id: playlist[1]! }
  const track = TRACK_ARTWORK_RE.exec(u)
  if (track) return { kind: "track", id: track[1]! }
  return null
}

const EPISODE_COLUMNS =
  "episode, show, display_name, artwork, status, radio_id, show_link"

const LINKED_SHOW_COLUMNS =
  "show_id, show_date, show_group, show_detail, show_venue_location, show_subvenue"

type EpisodeRow = {
  episode: string
  show: string | null
  display_name: string | null
  artwork: string | null
  radio_id: string | null
  show_link: string | null
}

function mapEpisodeRow(row: Record<string, unknown>): EpisodeRow | null {
  const episode = nonEmpty(row.episode)
  if (!episode) return null
  // `skipped` rows still resolve — an episode hidden from Program Director must
  // still label its schedule slot. Only REMOVED is dropped.
  if (nonEmpty(row.status) === "REMOVED") return null
  return {
    episode,
    show: nonEmpty(row.show),
    display_name: nonEmpty(row.display_name),
    artwork: nonEmpty(row.artwork),
    radio_id: nonEmpty(row.radio_id),
    show_link: nonEmpty(row.show_link),
  }
}

/** `show_id` → `mm.dd.yy · group · detail · location · venue`. */
async function fetchLinkedShowTitles(
  fetchRows: TrmnlFetchRows,
  showIds: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  const rows = await fetchChunked(
    fetchRows,
    "shows",
    LINKED_SHOW_COLUMNS,
    "show_id",
    showIds,
  )
  for (const row of rows) {
    const id = nonEmpty(row.show_id)
    if (!id || out.has(id)) continue
    const title = formatLinkedShowScheduleTitle({
      show_date: nonEmpty(row.show_date),
      show_group: nonEmpty(row.show_group),
      show_detail: nonEmpty(row.show_detail),
      show_venue_location: nonEmpty(row.show_venue_location),
      show_subvenue: nonEmpty(row.show_subvenue),
    })
    if (title) out.set(id, title)
  }
  return out
}

/** `show_id` → the canonical release's artwork (lowest `release_order`). */
async function fetchShowReleaseArtwork(
  fetchRows: TrmnlFetchRows,
  showIds: string[],
): Promise<Map<string, string>> {
  const best = new Map<string, { order: number; releaseId: string; art: string }>()
  const rows = await fetchChunked(
    fetchRows,
    "releases_shows",
    "show_id, release_id, release_order, releases(release_artwork)",
    "show_id",
    showIds,
  )
  for (const row of rows) {
    const showId = nonEmpty(row.show_id)
    const art = nonEmpty(firstRelated(row.releases)?.release_artwork)
    if (!showId || !art) continue
    const order =
      row.release_order == null ?
        Number.POSITIVE_INFINITY
      : Number(row.release_order)
    const releaseId = nonEmpty(row.release_id) ?? ""
    const prev = best.get(showId)
    if (
      !prev ||
      order < prev.order ||
      (order === prev.order && releaseId < prev.releaseId)
    ) {
      best.set(showId, { order, releaseId, art })
    }
  }
  return new Map([...best].map(([id, v]) => [id, v.art]))
}

/**
 * Episodes for the day's slots, keyed by slot index.
 *
 * Joined on `playlist.name` = `wted_episodes.episode`, with the playlist id
 * parsed out of the artwork URL as the fallback — the same two-step the
 * homepage's `attachWtedEpisodesToSlots` uses, because the name lookup misses
 * when RLS hides a `skipped` row.
 */
async function resolveSlotEpisodes(
  slots: TrmnlScheduleSlot[],
  fetchRows: TrmnlFetchRows,
): Promise<Array<EpisodeRow | null>> {
  const byEpisode = new Map<string, EpisodeRow>()
  for (const row of await fetchChunked(
    fetchRows,
    "wted_episodes",
    EPISODE_COLUMNS,
    "episode",
    slots.map((s) => s.playlistName),
  )) {
    const mapped = mapEpisodeRow(row)
    if (mapped && !byEpisode.has(mapped.episode)) byEpisode.set(mapped.episode, mapped)
  }

  const radioIds = slots
    .map((s) => parseRadioCoArtworkUrl(s.artworkUrl))
    .map((ref) => (ref?.kind === "playlist" ? ref.id : null))
    .filter((id): id is string => Boolean(id))

  const byRadioId = new Map<string, EpisodeRow>()
  for (const row of await fetchChunked(
    fetchRows,
    "wted_episodes",
    EPISODE_COLUMNS,
    "radio_id",
    radioIds,
  )) {
    const mapped = mapEpisodeRow(row)
    if (mapped?.radio_id && !byRadioId.has(mapped.radio_id)) {
      byRadioId.set(mapped.radio_id, mapped)
    }
  }

  return slots.map((slot) => {
    const byName = slot.playlistName ? byEpisode.get(slot.playlistName) : undefined
    if (byName) return byName
    const ref = parseRadioCoArtworkUrl(slot.artworkUrl)
    return ref?.kind === "playlist" ? (byRadioId.get(ref.id) ?? null) : null
  })
}

export type TrmnlScheduleResolution = {
  /** Display title per slot, index-aligned; null falls back to the playlist name. */
  titles: Array<string | null>
  /** `wted_episodes.artwork` for the slot on air, the header player's fallback. */
  onAirEpisodeArtwork: string | null
  /** `show_link` of the episode on air, when it airs a concert. */
  onAirShowLink: string | null
}

/**
 * Schedule titles exactly as the homepage renders them.
 *
 * Prefers the linked show's archive title, then `show · display_name` (with
 * Miscellaneous / Show Airings / requesTED / Mixes reduced to `display_name`),
 * matching `resolveRadioScheduleSlotTitle` / `formatWtedEpisodeScheduleTitle`.
 */
export async function resolveScheduleTitles(
  slots: TrmnlScheduleSlot[],
  onAirIndex: number,
  fetchRows: TrmnlFetchRows,
): Promise<TrmnlScheduleResolution> {
  if (slots.length === 0) {
    return { titles: [], onAirEpisodeArtwork: null, onAirShowLink: null }
  }

  const episodes = await resolveSlotEpisodes(slots, fetchRows)
  const linkedTitles = await fetchLinkedShowTitles(
    fetchRows,
    episodes.map((e) => e?.show_link).filter((id): id is string => Boolean(id)),
  )

  const titles = episodes.map((episode) => {
    if (!episode) return null
    const linked = episode.show_link ? linkedTitles.get(episode.show_link) : null
    if (linked) return linked
    return nonEmpty(formatEpisodeScheduleTitle(episode.show, episode.display_name))
  })

  const onAir = onAirIndex >= 0 ? episodes[onAirIndex] ?? null : null
  return {
    titles,
    onAirEpisodeArtwork: onAir?.artwork ?? null,
    onAirShowLink: onAir?.show_link ?? null,
  }
}

export type TrmnlArtworkInput = {
  /** `current_track.artwork_url` from Radio.co's status feed. */
  radioCoArtworkUrl: string | null
  /** Combined `{artist} - {title}` for the `wted_radio_ids` title match. */
  trackTitle: string | null
  /** From {@link resolveScheduleTitles}. */
  onAirEpisodeArtwork: string | null
  onAirShowLink: string | null
}

/**
 * Cover for the track on air, following the header player's chain.
 *
 * 1. Custom Radio.co artwork wins — but read off `wted_radio_ids.artwork`, not
 *    the feed, because Radio.co also serves track-shaped URLs for its automatic
 *    iTunes matches and those count as "no artwork" so a curated release cover
 *    can win instead.
 * 2. A concert airing uses the linked show's release cover; a track pointing at
 *    a *different* show is the filler at the end of the playlist and keeps its
 *    own show's cover. A track with no `show_id` is a station ID or bumper and
 *    inherits nothing.
 * 3. Otherwise (compilation, requesTED) the airing episode's own artwork.
 */
export async function resolveNowPlayingArtwork(
  input: TrmnlArtworkInput,
  fetchRows: TrmnlFetchRows,
): Promise<string | null> {
  const { radioCoArtworkUrl, trackTitle, onAirEpisodeArtwork, onAirShowLink } = input

  const ref = parseRadioCoArtworkUrl(radioCoArtworkUrl)
  const columns = "radio_id, track_artist, track_title, artwork, show_id"

  let track: Record<string, unknown> | null = null
  if (ref?.kind === "track") {
    track =
      (await fetchChunked(fetchRows, "wted_radio_ids", columns, "radio_id", [ref.id]))[0] ??
      null
  }
  if (!track && trackTitle) {
    // The feed often omits a track id (playlist artwork has no track stem), so
    // fall back to the combined title, as `fetchShowIdForRadioCoTrack` does.
    const parsed = parseCombinedTitle(trackTitle)
    const rows = await fetchChunked(
      fetchRows,
      "wted_radio_ids",
      columns,
      "track_title",
      [parsed?.title ?? trackTitle],
    )
    track =
      (parsed ?
        rows.find((r) => nonEmpty(r.track_artist) === parsed.artist)
      : undefined) ??
      rows[0] ??
      null
  }

  // 1. Custom artwork on the catalog row.
  if (ref?.kind === "track") {
    const custom = nonEmpty(track?.artwork)
    if (custom) return custom
  }

  const trackShowId = nonEmpty(track?.show_id)

  // 2. Concert airing.
  if (onAirShowLink) {
    if (trackShowId && trackShowId !== onAirShowLink) {
      const own = await fetchShowReleaseArtwork(fetchRows, [trackShowId])
      return own.get(trackShowId) ?? null
    }
    if (!trackShowId) return null
    const art = await fetchShowReleaseArtwork(fetchRows, [onAirShowLink])
    return art.get(onAirShowLink) ?? null
  }

  // 3. Compilation or requesTED airing; else the track's own concert cover.
  if (onAirEpisodeArtwork) return onAirEpisodeArtwork
  if (trackShowId) {
    const own = await fetchShowReleaseArtwork(fetchRows, [trackShowId])
    return own.get(trackShowId) ?? null
  }
  return null
}

/** `{artist} - {title}`, split on the first separator. */
function parseCombinedTitle(
  combined: string,
): { artist: string; title: string } | null {
  const trimmed = combined.trim()
  const sep = trimmed.indexOf(" - ")
  if (sep <= 0) return null
  const artist = trimmed.slice(0, sep).trim()
  const title = trimmed.slice(sep + 3).trim()
  if (!artist || !title) return null
  return { artist, title }
}
