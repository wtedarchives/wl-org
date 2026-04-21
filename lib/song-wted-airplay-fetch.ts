import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  SongWtedAirplayEpisodeLine,
  SongWtedAirplayGroup,
  SongWtedAirplayRow,
} from "@/types/song-wted-airplay"

const ENTRY_PAGE = 1000
const CHUNK = 500

function parseShowFromSetlistRow(raw: Record<string, unknown>): {
  showId: string | null
  showDate: string | null
  venueLocation: string | null
} {
  const rawShows = raw.shows as
    | {
        show_id?: string
        show_date?: string
        show_venue_location?: string | null
      }
    | null
    | undefined
    | Array<{
        show_id?: string
        show_date?: string
        show_venue_location?: string | null
      }>
  const shows = Array.isArray(rawShows) ? rawShows[0] : rawShows
  if (!shows) {
    return { showId: null, showDate: null, venueLocation: null }
  }
  return {
    showId: shows.show_id ?? null,
    showDate: shows.show_date ?? null,
    venueLocation: shows.show_venue_location ?? null,
  }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size))
  }
  return out
}

function groupSongWtedAirplayByPerformance(
  rows: SongWtedAirplayRow[],
): SongWtedAirplayGroup[] {
  const byEntry = new Map<string, SongWtedAirplayRow[]>()
  for (const row of rows) {
    const list = byEntry.get(row.setlistEntryId) ?? []
    list.push(row)
    byEntry.set(row.setlistEntryId, list)
  }

  const groups: SongWtedAirplayGroup[] = []
  for (const [setlistEntryId, list] of byEntry) {
    const first = list[0]!
    const episodes = [...list]
      .sort((a, b) => {
        const s = a.wtedSeries.localeCompare(b.wtedSeries, undefined, {
          sensitivity: "base",
        })
        if (s !== 0) return s
        return a.episodeUuid.localeCompare(b.episodeUuid)
      })
      .map((r) => ({
        eeUuid: r.eeUuid,
        episodeUuid: r.episodeUuid,
        episodeCode: r.episodeCode,
        episodeDisplayName: r.episodeDisplayName,
        wtedSeries: r.wtedSeries,
      }))
    groups.push({
      setlistEntryId,
      showId: first.showId,
      showDate: first.showDate,
      venueLocation: first.venueLocation,
      episodes,
    })
  }

  groups.sort((a, b) => {
    const ta = a.showDate
      ? new Date(a.showDate).getTime()
      : Number.POSITIVE_INFINITY
    const tb = b.showDate
      ? new Date(b.showDate).getTime()
      : Number.POSITIVE_INFINITY
    if (ta !== tb) return ta - tb
    return a.setlistEntryId.localeCompare(b.setlistEntryId)
  })

  return groups
}

/** Same song + same show can have multiple `entry_id` rows; merge to one header + deduped episodes. */
function mergeSongWtedGroupsByShow(
  groups: SongWtedAirplayGroup[],
): SongWtedAirplayGroup[] {
  const showMergeKey = (g: SongWtedAirplayGroup): string => {
    if (g.showId) return `show:${g.showId}`
    const d = g.showDate ?? ""
    const v = (g.venueLocation ?? "").trim()
    return `dv:${d}|${v}`
  }

  const byKey = new Map<string, SongWtedAirplayGroup[]>()
  for (const g of groups) {
    const k = showMergeKey(g)
    const list = byKey.get(k) ?? []
    list.push(g)
    byKey.set(k, list)
  }

  const merged: SongWtedAirplayGroup[] = []
  for (const list of byKey.values()) {
    const first = list[0]!
    const episodeByUuid = new Map<string, SongWtedAirplayEpisodeLine>()
    for (const g of list) {
      for (const ep of g.episodes) {
        if (!episodeByUuid.has(ep.episodeUuid)) {
          episodeByUuid.set(ep.episodeUuid, ep)
        }
      }
    }
    const episodes = [...episodeByUuid.values()].sort((a, b) => {
      const s = a.wtedSeries.localeCompare(b.wtedSeries, undefined, {
        sensitivity: "base",
      })
      if (s !== 0) return s
      return a.episodeUuid.localeCompare(b.episodeUuid)
    })
    const repEntryId = list
      .map((g) => g.setlistEntryId)
      .sort()[0]!
    merged.push({
      setlistEntryId: repEntryId,
      showId: first.showId,
      showDate: first.showDate,
      venueLocation: first.venueLocation,
      episodes,
    })
  }

  merged.sort((a, b) => {
    const ta = a.showDate
      ? new Date(a.showDate).getTime()
      : Number.POSITIVE_INFINITY
    const tb = b.showDate
      ? new Date(b.showDate).getTime()
      : Number.POSITIVE_INFINITY
    if (ta !== tb) return ta - tb
    return (a.showId ?? a.setlistEntryId).localeCompare(
      b.showId ?? b.setlistEntryId,
    )
  })

  return merged
}

/** All `wted_episode_entries` for this song, grouped by setlist performance (show date / venue). */
export async function fetchSongWtedAirplayRows(
  client: SupabaseClient,
  songCanonical: string,
): Promise<SongWtedAirplayGroup[]> {
  const setlistRows: Record<string, unknown>[] = []
  let from = 0
  for (;;) {
    const { data, error } = await client
      .from("setlist_entries")
      .select(
        `
        entry_id,
        shows (
          show_id,
          show_date,
          show_venue_location
        )
      `,
      )
      .eq("entry_song", songCanonical)
      .range(from, from + ENTRY_PAGE - 1)

    if (error) throw error
    if (!data?.length) break
    setlistRows.push(...(data as Record<string, unknown>[]))
    if (data.length < ENTRY_PAGE) break
    from += ENTRY_PAGE
  }

  if (setlistRows.length === 0) return []

  const entryMeta = new Map<
    string,
    { showId: string | null; showDate: string | null; venueLocation: string | null }
  >()
  for (const raw of setlistRows) {
    const id = raw.entry_id as string
    entryMeta.set(id, parseShowFromSetlistRow(raw))
  }

  const entryIds = [...entryMeta.keys()]
  const episodeEntryRows: {
    uuid: string
    song: string
    episode: string
  }[] = []

  for (const ids of chunk(entryIds, CHUNK)) {
    const { data, error } = await client
      .from("wted_episode_entries")
      .select("uuid, song, episode")
      .in("song", ids)
    if (error) throw error
    if (data?.length) episodeEntryRows.push(...(data as typeof episodeEntryRows))
  }

  if (episodeEntryRows.length === 0) return []

  const radioIds = [
    ...new Set(
      episodeEntryRows
        .map((r) => r.episode)
        .filter((r): r is string => typeof r === "string" && r.trim() !== ""),
    ),
  ]

  const episodeByRadioId = new Map<
    string,
    {
      uuid: string
      episode: string
      display_name: string | null
      show: string
      status: string | null
      radio_id: string | null
    }
  >()

  const rememberEpisodeRow = (r: {
    uuid: string
    episode: string
    display_name: string | null
    show: string
    status: string | null
    radio_id: string | null
  }) => {
    if (r.radio_id) episodeByRadioId.set(String(r.radio_id), r)
    episodeByRadioId.set(String(r.uuid), r)
  }

  for (const ids of chunk(radioIds, CHUNK)) {
    const { data, error } = await client
      .from("wted_episodes")
      .select("uuid, episode, display_name, show, status, radio_id")
      .in("radio_id", ids)
    if (error) throw error
    for (const row of data ?? []) {
      rememberEpisodeRow(
        row as {
          uuid: string
          episode: string
          display_name: string | null
          show: string
          status: string | null
          radio_id: string | null
        },
      )
    }
  }

  const unresolved = radioIds.filter((id) => !episodeByRadioId.has(String(id)))
  for (const ids of chunk(unresolved, CHUNK)) {
    if (ids.length === 0) continue
    const { data, error } = await client
      .from("wted_episodes")
      .select("uuid, episode, display_name, show, status, radio_id")
      .in("uuid", ids)
    if (error) throw error
    for (const row of data ?? []) {
      rememberEpisodeRow(
        row as {
          uuid: string
          episode: string
          display_name: string | null
          show: string
          status: string | null
          radio_id: string | null
        },
      )
    }
  }

  const built: SongWtedAirplayRow[] = []
  for (const ee of episodeEntryRows) {
    const meta = entryMeta.get(ee.song)
    if (!meta) continue
    const ep = episodeByRadioId.get(String(ee.episode))
    if (!ep || ep.status === "skipped") continue

    built.push({
      eeUuid: ee.uuid,
      setlistEntryId: ee.song,
      showId: meta.showId,
      showDate: meta.showDate,
      venueLocation: meta.venueLocation,
      episodeUuid: ep.uuid,
      episodeCode: ep.episode,
      episodeDisplayName: ep.display_name,
      wtedSeries: ep.show,
    })
  }

  return mergeSongWtedGroupsByShow(groupSongWtedAirplayByPerformance(built))
}
