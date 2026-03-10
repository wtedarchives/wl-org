import { supabase } from "@/lib/supabase"
import type {
  TopSong,
  ShowOpener,
  LongestSong,
  LiberatedSong,
} from "@/lib/types/stats"
import { timeToSeconds } from "./tour-utils"

const BATCH_SIZE = 100_000

async function fetchAllData<T>(
  buildQuery: (
    from: number,
    batchSize: number
  ) => Promise<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const allData: T[] = []
  let from = 0
  let hasMore = true
  while (hasMore) {
    const { data, error } = await buildQuery(from, BATCH_SIZE)
    if (error) throw error
    allData.push(...(data || []))
    if (!data || data.length < BATCH_SIZE) hasMore = false
    else from += BATCH_SIZE
  }
  return allData
}

// Apply year filter to Supabase query builder (chainable)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyYearFilter(query: any, selectedYear: number | string): any {
  if (selectedYear === "all-time") return query
  return query
    .gte("shows.show_date", `${selectedYear}-01-01`)
    .lte("shows.show_date", `${selectedYear}-12-31`)
}

export async function fetchTopSongsData(
  selectedYear: number | string
): Promise<TopSong[]> {
  const client = supabase
  if (!client) return []
  const allData = await fetchAllData(async (from, batchSize) => {
    let query = client
      .from("setlist_entries")
      .select(
        `
        entry_song,
        songs!inner(
          song_id,
          song_displayname,
          song_category,
          categories!inner(
            category_canonid,
            category_artwork
          )
        ),
        entry_show,
        shows!inner(
          show_date,
          show_group,
          show_canonid
        )
      `
      )
      .eq("shows.show_group", "Goose")
      .not("shows.show_canonid", "is", null)
    query = applyYearFilter(query, selectedYear)
    return query.range(from, from + batchSize - 1)
  })

  const songShowCounts = allData.reduce(
    (acc: Record<string, { song: string; song_displayname?: string | null; song_id: string; shows: Set<string>; category_canonid: number; category_artwork?: string }>,
    entry: Record<string, unknown>
  ) => {
    const songs = entry.songs as { song_id: string; song_displayname?: string | null; categories: { category_canonid: number; category_artwork?: string } } | { song_id: string; song_displayname?: string | null; categories: { category_canonid: number; category_artwork?: string } }[]
    const song = Array.isArray(songs) ? songs[0] : songs
    const songId = song?.song_id
    const showId = entry.entry_show as string
    if (!songId) return acc
    if (!acc[songId]) {
      acc[songId] = {
        song: entry.entry_song as string,
        song_displayname: song?.song_displayname ?? null,
        song_id: songId,
        shows: new Set([showId]),
        category_canonid: song?.categories?.category_canonid ?? 0,
        category_artwork: song?.categories?.category_artwork,
      }
    } else {
      acc[songId].shows.add(showId)
    }
    return acc
  },
  {} as Record<string, { song: string; song_displayname?: string | null; song_id: string; shows: Set<string>; category_canonid: number; category_artwork?: string }>
  )

  return Object.values(songShowCounts)
    .map((item) => ({
      song: item.song,
      song_displayname: item.song_displayname,
      song_id: item.song_id,
      play_count: item.shows.size,
      category_canonid: item.category_canonid,
      category_artwork: item.category_artwork,
    }))
    .sort((a, b) => {
      if (b.play_count !== a.play_count) return b.play_count - a.play_count
      if (a.category_canonid !== b.category_canonid)
        return a.category_canonid - b.category_canonid
      return a.song.localeCompare(b.song)
    })
    .slice(0, 10)
}

async function fetchPlacementData(
  selectedYear: number | string,
  placement: string | string[]
): Promise<ShowOpener[]> {
  const client = supabase
  if (!client) return []
  const allData = await fetchAllData(async (from, batchSize) => {
    let query = client
      .from("setlist_entries")
      .select(
        `
        entry_song,
        songs!inner(
          song_id,
          song_displayname,
          song_category,
          categories!inner(
            category_canonid,
            category_artwork
          )
        ),
        shows!inner(
          show_date,
          show_group,
          show_canonid
        )
      `
      )
      .eq("shows.show_group", "Goose")
      .not("shows.show_canonid", "is", null)
    if (Array.isArray(placement)) {
      query = query.in("entry_placement", placement)
    } else {
      query = query.eq("entry_placement", placement)
    }
    query = applyYearFilter(query, selectedYear)
    return query.range(from, from + batchSize - 1)
  })

  const counts = allData.reduce(
    (acc: Record<string, { song_name: string; song_displayname?: string | null; song_id: string; times_played: number; category_canonid: number; category_artwork?: string }>,
    entry: Record<string, unknown>
  ) => {
    const songName = entry.entry_song as string
    const songs = entry.songs as { song_id: string; song_displayname?: string | null; categories: { category_canonid: number; category_artwork?: string } } | { song_id: string; song_displayname?: string | null; categories: { category_canonid: number; category_artwork?: string } }[]
    const song = Array.isArray(songs) ? songs[0] : songs
    if (!song) return acc
    if (!acc[songName]) {
      acc[songName] = {
        song_name: songName,
        song_displayname: song.song_displayname ?? null,
        song_id: song.song_id,
        times_played: 1,
        category_canonid: song.categories?.category_canonid ?? 0,
        category_artwork: song.categories?.category_artwork,
      }
    } else {
      acc[songName].times_played++
    }
    return acc
  },
  {} as Record<string, { song_name: string; song_displayname?: string | null; song_id: string; times_played: number; category_canonid: number; category_artwork?: string }>
  )

  return Object.values(counts)
    .sort((a, b) => {
      if (b.times_played !== a.times_played)
        return b.times_played - a.times_played
      if (a.category_canonid !== b.category_canonid)
        return a.category_canonid - b.category_canonid
      return a.song_name.localeCompare(b.song_name)
    })
    .slice(0, 10)
}

export const fetchShowOpenersData = (selectedYear: number | string) =>
  fetchPlacementData(selectedYear, "Set 1 Opener")

export const fetchSetOpenersData = (selectedYear: number | string) =>
  fetchPlacementData(selectedYear, [
    "Set 1 Opener",
    "Set 2 Opener",
    "Set 3 Opener",
    "Set 4 Opener",
    "Set 5 Opener",
  ])

export const fetchSetClosersData = (selectedYear: number | string) =>
  fetchPlacementData(selectedYear, [
    "Set 1 Closer",
    "Set 2 Closer",
    "Set 3 Closer",
    "Set 4 Closer",
    "Set 5 Closer",
  ])

export const fetchEncoresData = (selectedYear: number | string) =>
  fetchPlacementData(selectedYear, ["Encore 1", "Encore 2", "Encore 3"])

export async function fetchLongestSongsData(
  selectedYear: number | string
): Promise<LongestSong[]> {
  const client = supabase
  if (!client) return []
  const allData = await fetchAllData(async (from, batchSize) => {
    let query = client
      .from("setlist_entries")
      .select(
        `
        entry_song,
        entry_length,
        entry_show,
        songs!inner(
          song_id,
          song_displayname,
          song_category,
          categories!inner(
            category_artwork
          )
        ),
        shows!inner(
          show_date,
          show_group,
          show_canonid,
          show_venue_location
        )
      `
      )
      .eq("shows.show_group", "Goose")
      .not("shows.show_canonid", "is", null)
      .not("entry_length", "is", null)
    query = applyYearFilter(query, selectedYear)
    return query.range(from, from + batchSize - 1)
  })

  const sortedData = allData
    .sort((a: { entry_length: string }, b: { entry_length: string }) => {
      const aSeconds = timeToSeconds(a.entry_length)
      const bSeconds = timeToSeconds(b.entry_length)
      return bSeconds - aSeconds
    })
    .slice(0, 10)

  return sortedData.map((entry: Record<string, unknown>) => {
    const songs = entry.songs as { song_id: string; song_displayname?: string | null; categories?: { category_artwork?: string } }
    return {
      song: entry.entry_song as string,
      song_displayname: songs?.song_displayname ?? null,
      song_id: songs?.song_id ?? "",
      entry_length: entry.entry_length as string,
      show_date: (entry.shows as { show_date?: string })?.show_date,
      show_id: entry.entry_show as string,
      venue_location: (entry.shows as { show_venue_location?: string })?.show_venue_location,
      category_artwork: songs?.categories?.category_artwork,
    }
  })
}

function extractNumberFromLastCount(lastCount: string | null): number {
  if (!lastCount) return 0
  if (lastCount.trim().toLowerCase() === "debut") return 0
  const match = lastCount.match(/^(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

export async function fetchLiberatedSongsData(
  selectedYear: number | string
): Promise<LiberatedSong[]> {
  const client = supabase
  if (!client) return []
  const allData = await fetchAllData(async (from, batchSize) => {
    let query = client
      .from("setlist_entries")
      .select(
        `
        entry_song,
        last_count,
        last_show_date,
        last_show_id,
        entry_show,
        entry_length,
        songs!inner(
          song_id,
          song_displayname,
          song_category,
          categories!inner(
            category_artwork
          )
        ),
        shows!inner(
          show_date,
          show_group,
          show_canonid,
          show_venue_location
        )
      `
      )
      .eq("shows.show_group", "Goose")
      .not("shows.show_canonid", "is", null)
      .not("last_count", "is", null)
      .not("last_show_date", "is", null)
    query = applyYearFilter(query, selectedYear)
    return query.range(from, from + batchSize - 1)
  })

  return allData
    .map((entry: Record<string, unknown>) => {
      const songs = entry.songs as { song_id?: string; song_displayname?: string | null; categories?: { category_artwork?: string } }
      const shows = entry.shows as { show_date?: string; show_venue_location?: string }
      return {
        song: entry.entry_song as string,
        song_displayname: songs?.song_displayname ?? null,
        song_id: songs?.song_id ?? "",
        last_count: entry.last_count as string | null,
        last_show_date: entry.last_show_date as string | null,
        last_show_id: entry.last_show_id as string | null,
        entry_length: entry.entry_length as string | undefined,
        show_date: shows?.show_date,
        show_id: entry.entry_show as string | undefined,
        venue_location: shows?.show_venue_location,
        category_artwork: songs?.categories?.category_artwork,
        _extractedCount: extractNumberFromLastCount(entry.last_count as string | null),
      }
    })
    .sort((a: { _extractedCount: number }, b: { _extractedCount: number }) => b._extractedCount - a._extractedCount)
    .slice(0, 10)
    .map(({ _extractedCount: _, ...entry }: Record<string, unknown>) => entry)
    .sort((a, b) => {
      const countA = extractNumberFromLastCount((a as { last_count: string | null }).last_count)
      const countB = extractNumberFromLastCount((b as { last_count: string | null }).last_count)
      return countB - countA
    }) as unknown as LiberatedSong[]
}
