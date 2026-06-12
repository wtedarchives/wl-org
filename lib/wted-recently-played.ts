import { fetchWtedCatalogRowDisplayArtwork } from "@/lib/wted-entry-release-artwork-fetch"
import { supabase } from "@/lib/supabase"
import {
  WTED_RADIO_HISTORY_URL,
  WTED_RECENTLY_PLAYED_LIMIT,
} from "@/lib/wted-radio-co-status"
import {
  formatWtedRadioTrackDisplayTitle,
  parseRadioCoHistoryTrackTitle,
} from "@/lib/wted-radio-track-display-title"
import {
  type WtedRadioIdRow,
  wtedRadioIdsRowArtworkUrl,
} from "@/lib/wted-radio-ids-sync"

export type WtedRecentlyPlayedTrack = {
  id: string
  title: string
  startTime: string
  artworkUrl: string | null
}

type RadioCoHistoryTrack = {
  title?: string
  start_time?: string
  artwork_url?: string
}

type RadioCoHistoryResponse = {
  tracks?: RadioCoHistoryTrack[]
}

const TRACK_TITLE_LOOKUP_CHUNK = 100

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size))
  }
  return out
}

export async function fetchWtedRecentlyPlayedFromHistory(
  limit: number = WTED_RECENTLY_PLAYED_LIMIT,
): Promise<Omit<WtedRecentlyPlayedTrack, "artworkUrl">[]> {
  const res = await fetch(WTED_RADIO_HISTORY_URL, { cache: "no-store" })
  if (!res.ok) {
    throw new Error(`Radio.co history returned ${res.status}`)
  }

  const json = (await res.json()) as RadioCoHistoryResponse
  const tracks = json.tracks ?? []

  return tracks
    .map((track, index) => {
      const title = track.title?.trim()
      if (!title) return null
      const startTime = track.start_time?.trim() || ""
      return {
        id: `${startTime || "track"}-${index}-${title}`,
        title,
        startTime,
      }
    })
    .filter((track): track is Omit<WtedRecentlyPlayedTrack, "artworkUrl"> =>
      Boolean(track),
    )
    .slice(0, limit)
}

function catalogLookupTitlesFromHistoryTitles(historyTitles: string[]): string[] {
  const out = new Set<string>()

  for (const historyTitle of historyTitles) {
    const trimmed = historyTitle.trim()
    if (!trimmed) continue

    const parsed = parseRadioCoHistoryTrackTitle(trimmed)
    if (parsed) {
      out.add(parsed.title)
      continue
    }

    out.add(trimmed)
  }

  return [...out]
}

async function fetchWtedRadioIdsByHistoryTitles(
  historyTitles: string[],
): Promise<Map<string, WtedRadioIdRow>> {
  const map = new Map<string, WtedRadioIdRow>()
  if (!supabase || historyTitles.length === 0) return map

  const catalogTitles = catalogLookupTitlesFromHistoryTitles(historyTitles)
  if (catalogTitles.length === 0) return map

  for (const titleChunk of chunk(catalogTitles, TRACK_TITLE_LOOKUP_CHUNK)) {
    const { data, error } = await supabase
      .from("wted_radio_ids")
      .select("uuid, radio_id, track_artist, track_title, status, artwork")
      .in("track_title", titleChunk)

    if (error) throw error

    for (const row of (data ?? []) as WtedRadioIdRow[]) {
      const displayTitle = formatWtedRadioTrackDisplayTitle(row)
      if (displayTitle && !map.has(displayTitle)) {
        map.set(displayTitle, row)
      }
    }
  }

  return map
}

async function resolveTrackArtwork(
  historyTitle: string,
  catalogByDisplayTitle: Map<string, WtedRadioIdRow>,
): Promise<string | null> {
  const trimmed = historyTitle.trim()
  let row = catalogByDisplayTitle.get(trimmed)

  if (!row) {
    const parsed = parseRadioCoHistoryTrackTitle(trimmed)
    if (parsed) {
      row = [...catalogByDisplayTitle.values()].find(
        (candidate) =>
          candidate.track_artist?.trim() === parsed.artist &&
          candidate.track_title?.trim() === parsed.title,
      )
    }
  }

  if (!row) return null

  const direct = wtedRadioIdsRowArtworkUrl(row)
  if (direct) return direct

  if (!supabase) return null

  return fetchWtedCatalogRowDisplayArtwork(supabase, row)
}

export async function attachArtworkToRecentlyPlayedTracks(
  tracks: Omit<WtedRecentlyPlayedTrack, "artworkUrl">[],
): Promise<WtedRecentlyPlayedTrack[]> {
  if (tracks.length === 0) return []

  const catalogByDisplayTitle = await fetchWtedRadioIdsByHistoryTitles(
    tracks.map((track) => track.title),
  )

  const artworkUrls = await Promise.all(
    tracks.map((track) =>
      resolveTrackArtwork(track.title, catalogByDisplayTitle),
    ),
  )

  return tracks.map((track, index) => ({
    ...track,
    artworkUrl: artworkUrls[index] ?? null,
  }))
}

export async function fetchWtedRecentlyPlayedTracks(
  limit: number = WTED_RECENTLY_PLAYED_LIMIT,
): Promise<WtedRecentlyPlayedTrack[]> {
  const tracks = await fetchWtedRecentlyPlayedFromHistory(limit)
  return attachArtworkToRecentlyPlayedTracks(tracks)
}
