/**
 * Recently Played: Radio.co's history feed, with artwork resolved per AIRING.
 *
 * The core insight this file is built on: the same track needs DIFFERENT artwork
 * depending on what was on air. A song from Concert X is one `wted_radio_ids`
 * row, but it airs in Concert X's playlist, inside compilations, and during
 * requesTED — and each of those wants a different image. Artwork therefore
 * cannot be a property of the track; it is a property of (episode, track).
 *
 * Radio.co hands us that pairing for free, because `artwork_url` is
 * self-describing:
 *
 *   .../playlist.1031974.100.1723233877.png   <- the PLAYLIST that was airing
 *   .../32898955.100.1741193697.jpg           <- the TRACK's own custom art
 *
 * A track-shaped URL appears exactly when Radio.co has track-level art, which is
 * also the only case where custom art should win. So the URL shape alone routes
 * between the two branches, and no schedule join or timestamp matching is needed.
 *
 * Resolution order:
 *   1. Track has CUSTOM art on Radio.co            -> use it.
 *   2. Airing episode is a concert (`show_link`)   -> that show's lowest
 *      `release_order` release artwork; a track pointing at a DIFFERENT show is
 *      the filler and keeps its own show's artwork.
 *   3. Airing episode is a compilation/requesTED   -> `wted_episodes.artwork`
 *      for its members; non-members with a `show_id` are fillers and keep their
 *      own show's artwork.
 *   4. Anything else (tag-pulled station IDs and bumpers) -> the airing
 *      episode's `wted_episodes.artwork` (the same image the Upcoming
 *      Schedule card shows for that show). If that is also empty, the UI
 *      falls back to the WL image / broadcast placeholder.
 */
import type { SupabaseClient } from "@supabase/supabase-js"

import { supabase } from "@/lib/supabase"
import {
  formatLinkedShowScheduleTitle,
  formatWtedEpisodeScheduleTitle,
} from "@/lib/wted-episodes-schedule-lookup"
import {
  WTED_RADIO_HISTORY_URL,
  WTED_RECENTLY_PLAYED_LIMIT,
} from "@/lib/wted-radio-co-status"
import { parseRadioCoHistoryTrackTitle } from "@/lib/wted-radio-track-display-title"

export type WtedRecentlyPlayedTrack = {
  id: string
  title: string
  startTime: string
  artworkUrl: string | null
  /** Radio.co playlist id that was on air, when the feed exposes one. */
  episodeRadioId: string | null
  /** Episode name for the divider row; null when the episode is unknown. */
  episodeName: string | null
  /**
   * True on the first row of each contiguous run of the same episode. The list
   * is newest-first, so this marks the TOP of a block and the UI labels it.
   */
  startsEpisode: boolean
}

type RadioCoHistoryTrack = {
  title?: string
  start_time?: string
  artwork_url?: string
}

type HistoryEntry = {
  id: string
  title: string
  startTime: string
  artworkUrl: string | null
}

type TrackRow = {
  radio_id: string
  track_artist: string | null
  track_title: string | null
  artwork: string | null
  show_id: string | null
  wted_show_id: string | null
}

type EpisodeRow = {
  radio_id: string
  episode: string | null
  show: string | null
  display_name: string | null
  show_link: string | null
  artwork: string | null
}

const LOOKUP_CHUNK = 100

/**
 * Radio.co album art paths.
 *
 * `playlist.{id}` is the airing playlist; a bare numeric stem is the track id.
 * Both live under the same `images.radio.co/album_art/{station}/` prefix, so the
 * `playlist.` marker is the only thing separating them — test for it first.
 */
const PLAYLIST_ARTWORK_RE = /\/playlist\.(\d+)\./
const TRACK_ARTWORK_RE = /\/(\d+)\.\d+\.\d+\.[a-z]+(?:\?|$)/i

type ArtworkRef =
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

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

function nonEmpty(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/**
 * PostgREST returns a to-one embed as an object, but the generated types widen
 * every embed to an array. Accept both so the runtime shape and the type agree.
 */
function firstRelated<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

/**
 * Recover the airing episode for entries whose artwork URL carries no playlist
 * id — tracks with their own art, and the id-less `media.radio.co/artwork/…`
 * shape.
 *
 * The station plays a playlist through in order, so an entry sitting between two
 * tracks of the SAME episode aired during that episode.
 *
 * Interior gaps require both neighbours to agree. Gaps at either END of the
 * window have only one neighbour, and are filled from it anyway: the newest row
 * is very often a track with custom art (which is exactly why its URL carries no
 * playlist id), and leaving it unknown pushes the divider a row too low — the
 * show's first track ends up sitting ABOVE its own heading.
 *
 * The bet is that a boundary falls precisely on the edge of the window far less
 * often than a custom-art track does, and it self-corrects on the next poll once
 * a playlist-shaped URL enters the window.
 */
function fillEpisodeGaps(ids: (string | null)[]): (string | null)[] {
  const out = [...ids]

  for (let i = 0; i < out.length; i++) {
    if (out[i] != null) continue

    let before: string | null = null
    for (let j = i - 1; j >= 0; j--) {
      if (ids[j] != null) {
        before = ids[j]!
        break
      }
    }

    let after: string | null = null
    for (let j = i + 1; j < ids.length; j++) {
      if (ids[j] != null) {
        after = ids[j]!
        break
      }
    }

    if (before != null && after != null) {
      if (before === after) out[i] = before
    } else {
      out[i] = before ?? after
    }
  }

  return out
}

export async function fetchWtedRecentlyPlayedFromHistory(
  limit: number = WTED_RECENTLY_PLAYED_LIMIT,
): Promise<HistoryEntry[]> {
  const res = await fetch(WTED_RADIO_HISTORY_URL, { cache: "no-store" })
  if (!res.ok) throw new Error(`Radio.co history returned ${res.status}`)

  const json = (await res.json()) as { tracks?: RadioCoHistoryTrack[] }

  return (json.tracks ?? [])
    .map((track, index) => {
      const title = track.title?.trim()
      if (!title) return null
      const startTime = track.start_time?.trim() || ""
      return {
        id: `${startTime || "track"}-${index}-${title}`,
        title,
        startTime,
        artworkUrl: nonEmpty(track.artwork_url),
      }
    })
    .filter((t): t is HistoryEntry => Boolean(t))
    .slice(0, limit)
}

/** `radio_id` -> row, for tracks whose own art Radio.co served. */
async function fetchTracksByRadioId(
  client: SupabaseClient,
  radioIds: string[],
): Promise<Map<string, TrackRow>> {
  const map = new Map<string, TrackRow>()
  for (const ids of chunk(radioIds, LOOKUP_CHUNK)) {
    const { data, error } = await client
      .from("wted_radio_ids")
      .select("radio_id, track_artist, track_title, artwork, show_id, wted_show_id")
      .in("radio_id", ids)
    if (error) throw error
    for (const row of (data ?? []) as TrackRow[]) map.set(row.radio_id, row)
  }
  return map
}

/**
 * `"{artist} - {title}"` -> row, for entries the feed identified only by name.
 *
 * Keyed on artist AND title rather than title alone: `track_title` is not unique
 * (several shows have an `Intro`), and matching on it by itself picks whichever
 * row the database happens to return first.
 */
async function fetchTracksByHistoryTitles(
  client: SupabaseClient,
  titles: string[],
): Promise<Map<string, TrackRow>> {
  const wanted = new Set<string>()
  for (const title of titles) {
    const parsed = parseRadioCoHistoryTrackTitle(title)
    wanted.add(parsed ? parsed.title : title)
  }

  const map = new Map<string, TrackRow>()
  for (const ids of chunk([...wanted], LOOKUP_CHUNK)) {
    const { data, error } = await client
      .from("wted_radio_ids")
      .select("radio_id, track_artist, track_title, artwork, show_id, wted_show_id")
      .in("track_title", ids)
    if (error) throw error
    for (const row of (data ?? []) as TrackRow[]) {
      const artist = nonEmpty(row.track_artist)
      const title = nonEmpty(row.track_title)
      if (!title) continue
      const key = artist ? `${artist} - ${title}` : title
      if (!map.has(key)) map.set(key, row)
    }
  }
  return map
}

async function fetchEpisodes(
  client: SupabaseClient,
  radioIds: string[],
): Promise<Map<string, EpisodeRow>> {
  const map = new Map<string, EpisodeRow>()
  for (const ids of chunk(radioIds, LOOKUP_CHUNK)) {
    const { data, error } = await client
      .from("wted_episodes")
      .select("radio_id, episode, show, display_name, show_link, artwork")
      .in("radio_id", ids)
    if (error) throw error
    for (const row of (data ?? []) as EpisodeRow[]) map.set(row.radio_id, row)
  }
  return map
}

/**
 * `show_id` -> release artwork, picking the show's canonical release.
 *
 * A show routinely has several releases and the lowest `release_order` is NOT
 * always 1, so this orders and takes the first rather than filtering on `= 1`.
 * Mirrors `wted_radio_ids_catalog`; `release_id` breaks ties for stability.
 */
async function fetchShowReleaseArtwork(
  client: SupabaseClient,
  showIds: string[],
): Promise<Map<string, string>> {
  const best = new Map<string, { order: number; releaseId: string; art: string }>()

  for (const ids of chunk(showIds, LOOKUP_CHUNK)) {
    const { data, error } = await client
      .from("releases_shows")
      .select("show_id, release_id, release_order, releases(release_artwork)")
      .in("show_id", ids)
    if (error) throw error

    type Row = {
      show_id: string
      release_id: string
      release_order: number | null
      releases: { release_artwork: string | null } | { release_artwork: string | null }[] | null
    }

    for (const row of (data ?? []) as unknown as Row[]) {
      const art = nonEmpty(firstRelated(row.releases)?.release_artwork)
      if (!art) continue
      const order = row.release_order ?? Number.POSITIVE_INFINITY
      const prev = best.get(row.show_id)
      if (
        !prev ||
        order < prev.order ||
        (order === prev.order && row.release_id < prev.releaseId)
      ) {
        best.set(row.show_id, { order, releaseId: row.release_id, art })
      }
    }
  }

  const out = new Map<string, string>()
  for (const [showId, v] of best) out.set(showId, v.art)
  return out
}

/** Episode radio_id -> set of member track radio_ids, from wted_episode_entries. */
async function fetchEpisodeMembership(
  client: SupabaseClient,
  episodeRadioIds: string[],
): Promise<Map<string, Set<string>>> {
  const map = new Map<string, Set<string>>()
  for (const ids of chunk(episodeRadioIds, LOOKUP_CHUNK)) {
    const { data, error } = await client
      .from("wted_episode_entries")
      .select("episode, setlist_entries(radio_id)")
      .in("episode", ids)
    if (error) throw error
    type Row = {
      episode: string
      setlist_entries: { radio_id: string | null } | { radio_id: string | null }[] | null
    }

    for (const row of (data ?? []) as unknown as Row[]) {
      const radioId = nonEmpty(firstRelated(row.setlist_entries)?.radio_id)
      if (!radioId) continue
      const set = map.get(row.episode) ?? new Set<string>()
      set.add(radioId)
      map.set(row.episode, set)
    }
  }
  return map
}

/** Titles for the concerts behind concert episodes, keyed by `shows.show_id`. */
async function fetchLinkedShowTitles(
  client: SupabaseClient,
  showIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  for (const ids of chunk(showIds, LOOKUP_CHUNK)) {
    const { data, error } = await client
      .from("shows")
      .select(
        "show_id, show_date, show_group, show_detail, show_venue_location, show_subvenue",
      )
      .in("show_id", ids)
    if (error) throw error
    for (const row of (data ?? []) as Array<
      { show_id: string } & Parameters<typeof formatLinkedShowScheduleTitle>[0]
    >) {
      const title = formatLinkedShowScheduleTitle(row)
      if (title) map.set(row.show_id, title)
    }
  }
  return map
}

/**
 * Divider label for an episode.
 *
 * Reuses the Upcoming Schedule's own formatter so a show is named identically in
 * both places: the linked concert title when `show_link` resolves, else
 * `show · display_name` (with the prefix dropped for the Miscellaneous / Show
 * Airings / requesTED / Mixes buckets).
 *
 * Falls back to the raw Radio.co playlist name only when that yields nothing.
 * It is the worse label — it carries admin cruft like "(copy)", "TEST" and
 * "OLD DON'T USE ***", and runs to 86 characters — so it is a last resort
 * rather than the default. Whitespace is collapsed either way, because some
 * names contain embedded newlines.
 */
function episodeLabel(
  episode: EpisodeRow | null | undefined,
  linkedShowTitles: Map<string, string>,
): string | null {
  if (!episode) return null

  const scheduleTitle = formatWtedEpisodeScheduleTitle({
    show: episode.show ?? "",
    display_name: episode.display_name,
    linkedShowTitle: episode.show_link ?
      linkedShowTitles.get(episode.show_link) ?? null
    : null,
  })

  const label = scheduleTitle ?? episode.episode ?? ""
  return nonEmpty(label.replace(/\s+/g, " "))
}

export async function attachArtworkToRecentlyPlayedTracks(
  entries: HistoryEntry[],
): Promise<WtedRecentlyPlayedTrack[]> {
  if (entries.length === 0) return []

  const refs = entries.map((e) => parseRadioCoArtworkUrl(e.artworkUrl))

  // Without a database we can still show the feed's own artwork; a broken
  // resolver should degrade to Radio.co's picture rather than to no list.
  if (!supabase) {
    return entries.map((entry, i) => ({
      ...entry,
      artworkUrl: entry.artworkUrl,
      episodeRadioId: refs[i]?.kind === "playlist" ? refs[i]!.id : null,
      episodeName: null,
      startsEpisode: false,
    }))
  }

  const client = supabase
  // Episode per entry, with gaps recovered from surrounding rows.
  const airingEpisodeIds = fillEpisodeGaps(
    refs.map((r) => (r?.kind === "playlist" ? r.id : null)),
  )
  const playlistIds = [...new Set(airingEpisodeIds.filter((id): id is string => id != null))]
  const trackIds = [
    ...new Set(refs.flatMap((r) => (r?.kind === "track" ? [r.id] : []))),
  ]

  const [episodes, tracksById, tracksByTitle] = await Promise.all([
    playlistIds.length ? fetchEpisodes(client, playlistIds) : new Map<string, EpisodeRow>(),
    trackIds.length ? fetchTracksByRadioId(client, trackIds) : new Map<string, TrackRow>(),
    fetchTracksByHistoryTitles(client, entries.map((e) => e.title)),
  ])

  const resolveRow = (entry: HistoryEntry, ref: ArtworkRef): TrackRow | null => {
    if (ref?.kind === "track") {
      const byId = tracksById.get(ref.id)
      if (byId) return byId
    }
    return tracksByTitle.get(entry.title) ?? null
  }

  // Every show we might need artwork for: the concert behind an airing episode,
  // plus any filler pointing at a show of its own.
  const showIds = new Set<string>()
  for (const [i, entry] of entries.entries()) {
    const airing = airingEpisodeIds[i]
    if (airing) {
      const showLink = nonEmpty(episodes.get(airing)?.show_link)
      if (showLink) showIds.add(showLink)
    }
    const row = resolveRow(entry, refs[i]!)
    if (row?.show_id) showIds.add(row.show_id)
  }

  const compilationIds = playlistIds.filter((id) => !episodes.get(id)?.show_link)

  // Only the concerts BEHIND an episode need a title; a filler's own show is
  // used for artwork but is never a divider label.
  const linkedShowIds = [
    ...new Set(
      playlistIds.flatMap((id) => {
        const link = nonEmpty(episodes.get(id)?.show_link)
        return link ? [link] : []
      }),
    ),
  ]

  const [showArtwork, membership, linkedShowTitles] = await Promise.all([
    showIds.size ? fetchShowReleaseArtwork(client, [...showIds]) : new Map<string, string>(),
    compilationIds.length ?
      fetchEpisodeMembership(client, compilationIds)
    : new Map<string, Set<string>>(),
    linkedShowIds.length ?
      fetchLinkedShowTitles(client, linkedShowIds)
    : new Map<string, string>(),
  ])

  const resolved = entries.map((entry, i) => {
    const ref = refs[i]!
    const row = resolveRow(entry, ref)
    const episodeRadioId = airingEpisodeIds[i] ?? null
    const episode = episodeRadioId ? episodes.get(episodeRadioId) : null

    // 1. Custom Radio.co artwork always wins.
    //
    // Guarded on the DB column rather than trusting the feed: Radio.co also
    // serves track-shaped URLs for its automatic iTunes matches, and those are
    // deliberately treated as "no artwork" so a curated release cover can win
    // instead — the same call `wted_radio_ids_catalog` makes.
    //
    // The episode still rides along even though it did not decide the artwork —
    // the row is part of that block and must not split its divider.
    if (ref?.kind === "track") {
      const custom = nonEmpty(row?.artwork)
      if (custom) {
        return {
          artworkUrl: custom,
          episodeRadioId,
          episodeName: episodeLabel(episode, linkedShowTitles),
        }
      }
    }

    const episodeName = episodeLabel(episode, linkedShowTitles)

    const ownShowArt = row?.show_id ? showArtwork.get(row.show_id) ?? null : null

    if (!episode) {
      // Radio.co also serves art from a third URL shape carrying no id at all
      // (media.radio.co/artwork/{station}/{hash}-100.jpeg), which leaves the
      // airing episode unknown. Falling back to the track's OWN show is better
      // than dropping straight to WL — for a concert song it is the right cover
      // anyway, and it is never wildly wrong.
      return {
        artworkUrl: nonEmpty(row?.artwork) ?? ownShowArt,
        episodeRadioId,
        episodeName,
      }
    }

    const showLink = nonEmpty(episode.show_link)

    // 2. Concert airing.
    if (showLink) {
      // A track pointing at a different concert is the filler at the end of the
      // playlist; it keeps its own show's cover rather than borrowing this one.
      if (row?.show_id && row.show_id !== showLink) {
        return { artworkUrl: ownShowArt, episodeRadioId, episodeName }
      }
      // `show_id` null means the track is not part of this concert at all — a
      // station ID or bumper Radio.co pulled from a tag slot. Those fall back to
      // WL rather than inheriting the concert's cover.
      if (!row?.show_id) {
        return { artworkUrl: null, episodeRadioId, episodeName }
      }
      return {
        artworkUrl: showArtwork.get(showLink) ?? null,
        episodeRadioId,
        episodeName,
      }
    }

    // 3. Compilation or requesTED airing.
    //
    // Membership is deliberately NOT gated on `wted_episode_entries`. That table
    // records only 47% of what is actually in these playlists (1,716 of 3,681
    // crawled track slots), and dozens of compilations have no entries at all —
    // so requiring an entry would send more than half of every compilation's
    // tracks to their own concert's cover instead of the playlist's.
    //
    // Instead, anything the catalog can identify AT ALL counts as part of the
    // show: a `wted_show_id` for this episode (the intros and outros backfilled
    // from the playlist crawl), a recorded entry, or simply a `show_id` marking
    // it as a real song rather than station filler.
    const belongsToEpisode =
      row != null &&
      (row.wted_show_id === episode.radio_id ||
        membership.get(episode.radio_id)?.has(row.radio_id) === true ||
        row.show_id != null)

    if (belongsToEpisode) {
      return {
        artworkUrl: nonEmpty(episode.artwork) ?? ownShowArt,
        episodeRadioId,
        episodeName,
      }
    }

    // 4. No identity in the catalog — a tag-pulled station ID or bumper.
    return { artworkUrl: null, episodeRadioId, episodeName }
  })

  const withShowArtwork = resolved.map((r) => {
    if (r.artworkUrl) return r
    const episode = r.episodeRadioId ? episodes.get(r.episodeRadioId) : null
    const showArt = nonEmpty(episode?.artwork)
    if (!showArt) return r
    return { ...r, artworkUrl: showArt }
  })

  /**
   * A run of one episode is regularly interrupted by rows whose episode we
   * cannot name — a track with custom art, or the id-less artwork URL shape.
   * Those must not split the block, or a single show is labelled several times
   * over. So the boundary is measured against the last KNOWN episode rather
   * than the immediately preceding row.
   */
  let lastKnownEpisode: string | null = null

  return entries.map((entry, i) => {
    const r = withShowArtwork[i]!
    const startsEpisode =
      r.episodeRadioId != null && r.episodeRadioId !== lastKnownEpisode
    if (r.episodeRadioId != null) lastKnownEpisode = r.episodeRadioId

    return {
      ...entry,
      artworkUrl: r.artworkUrl,
      episodeRadioId: r.episodeRadioId,
      episodeName: r.episodeName,
      startsEpisode,
    }
  })
}

export async function fetchWtedRecentlyPlayedTracks(
  limit: number = WTED_RECENTLY_PLAYED_LIMIT,
): Promise<WtedRecentlyPlayedTrack[]> {
  const entries = await fetchWtedRecentlyPlayedFromHistory(limit)
  return attachArtworkToRecentlyPlayedTracks(entries)
}
