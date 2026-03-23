import type { SupabaseClient } from "@supabase/supabase-js"

import type {
  AttendedShowJoined,
  CategoryProgress,
  LooseEndRow,
  ShowForLooseEnds,
  StandsAttended,
} from "@/types/loose-ends"

const PAGE_SIZE = 1000
const IN_CHUNK = 200
/** Max song titles per `.in("entry_song", …)` when scanning canonical setlists */
const SONG_IN_CHUNK = 80

export async function fetchAllShowIdsForUser(
  client: SupabaseClient,
  userId: string,
  onProgress: (p: number) => void
): Promise<string[]> {
  const ids: string[] = []
  let page = 0
  let hasMore = true
  while (hasMore) {
    const { data, error } = await client
      .from("user_attended_shows")
      .select("show_id")
      .eq("user_id", userId)
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (error) throw error
    if (data?.length) {
      ids.push(...data.map((r) => r.show_id))
      page++
      onProgress(Math.min(15, 5 + page * 2))
      hasMore = data.length === PAGE_SIZE
    } else {
      hasMore = false
    }
  }
  return ids
}

export async function fetchShowsForLooseEnds(
  client: SupabaseClient,
  showIds: string[],
  onProgress: (p: number) => void
): Promise<ShowForLooseEnds[]> {
  if (showIds.length === 0) return []

  const chunks: string[][] = []
  for (let i = 0; i < showIds.length; i += IN_CHUNK) {
    chunks.push(showIds.slice(i, i + IN_CHUNK))
  }

  const all: ShowForLooseEnds[] = []
  for (let ci = 0; ci < chunks.length; ci++) {
    const chunk = chunks[ci]
    let page = 0
    let hasMore = true
    while (hasMore) {
      const { data, error } = await client
        .from("shows")
        .select(
          `
          show_id,
          show_canonid,
          show_detail,
          show_year,
          show_date,
          show_tour,
          show_stand,
          show_subvenue,
          show_subvenue_venue,
          show_group
        `
        )
        .in("show_id", chunk)
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (error) throw error
      if (data?.length) {
        all.push(...(data as ShowForLooseEnds[]))
        page++
        hasMore = data.length === PAGE_SIZE
      } else {
        hasMore = false
      }
    }
    onProgress(15 + Math.round((ci + 1) * (20 / chunks.length)))
  }
  return all
}

export function buildAttendedJoined(
  showIds: string[],
  shows: ShowForLooseEnds[]
): AttendedShowJoined[] {
  const byId = new Map(shows.map((s) => [s.show_id, s]))
  return showIds.map((id) => ({
    show_id: id,
    shows: byId.get(id) ?? null,
  }))
}

export async function fetchGlobalVenueNames(
  client: SupabaseClient
): Promise<string[]> {
  const names: string[] = []
  let page = 0
  let hasMore = true
  while (hasMore) {
    const { data, error } = await client
      .from("venues")
      .select("venue")
      .eq("venue_global", true)
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (error) throw error
    if (data?.length) {
      names.push(...data.map((r) => r.venue))
      page++
      hasMore = data.length === PAGE_SIZE
    } else {
      hasMore = false
    }
  }
  return names
}

export async function countDebutsForShows(
  client: SupabaseClient,
  canonicalShowIds: string[]
): Promise<number> {
  if (canonicalShowIds.length === 0) return 0
  let total = 0
  for (let i = 0; i < canonicalShowIds.length; i += IN_CHUNK) {
    const chunk = canonicalShowIds.slice(i, i + IN_CHUNK)
    let page = 0
    let hasMore = true
    while (hasMore) {
      const { data, error } = await client
        .from("setlist_entries")
        .select("entry_id")
        .in("entry_show", chunk)
        .eq("last_count", "Debut")
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (error) throw error
      if (data?.length) {
        total += data.length
        page++
        hasMore = data.length === PAGE_SIZE
      } else {
        hasMore = false
      }
    }
  }
  return total
}

/** All shows with a non-null canon id (band “canonical” performances). */
export async function fetchCanonicalShowIds(
  client: SupabaseClient
): Promise<string[]> {
  const ids: string[] = []
  let page = 0
  let hasMore = true
  while (hasMore) {
    const { data, error } = await client
      .from("shows")
      .select("show_id")
      .not("show_canonid", "is", null)
      .order("show_id", { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (error) throw error
    if (data?.length) {
      ids.push(...data.map((r) => r.show_id))
      page++
      hasMore = data.length === PAGE_SIZE
    } else {
      hasMore = false
    }
  }
  return ids
}

/**
 * Songs (from the given list) that appear on at least one canonical setlist.
 */
async function collectCanonicallyPlayedSubset(
  client: SupabaseClient,
  canonicalShowIds: string[],
  songNames: string[],
  onProgress?: (frac: number) => void
): Promise<Set<string>> {
  const played = new Set<string>()
  const uniqueSongs = [...new Set(songNames.filter(Boolean))]
  if (canonicalShowIds.length === 0 || uniqueSongs.length === 0) {
    onProgress?.(1)
    return played
  }

  const showChunks: string[][] = []
  for (let i = 0; i < canonicalShowIds.length; i += IN_CHUNK) {
    showChunks.push(canonicalShowIds.slice(i, i + IN_CHUNK))
  }

  const songChunks: string[][] = []
  for (let i = 0; i < uniqueSongs.length; i += SONG_IN_CHUNK) {
    songChunks.push(uniqueSongs.slice(i, i + SONG_IN_CHUNK))
  }

  const totalWork = Math.max(1, showChunks.length * songChunks.length)
  let done = 0

  for (const showChunk of showChunks) {
    for (const songChunk of songChunks) {
      let p = 0
      let hasMore = true
      while (hasMore) {
        const { data, error } = await client
          .from("setlist_entries")
          .select("entry_song")
          .in("entry_show", showChunk)
          .in("entry_song", songChunk)
          .range(p * PAGE_SIZE, (p + 1) * PAGE_SIZE - 1)

        if (error) throw error
        if (data?.length) {
          for (const row of data) {
            if (row.entry_song) played.add(row.entry_song)
          }
          p++
          hasMore = data.length === PAGE_SIZE
        } else {
          hasMore = false
        }
      }
      done++
      onProgress?.(done / totalWork)
    }
  }
  return played
}

async function collectHeardSongNames(
  client: SupabaseClient,
  attendedShowIds: string[],
  onProgress: (frac: number) => void
): Promise<Set<string>> {
  const heard = new Set<string>()
  if (attendedShowIds.length === 0) return heard

  const chunks: string[][] = []
  for (let i = 0; i < attendedShowIds.length; i += IN_CHUNK) {
    chunks.push(attendedShowIds.slice(i, i + IN_CHUNK))
  }

  for (let ci = 0; ci < chunks.length; ci++) {
    const chunk = chunks[ci]
    let page = 0
    let hasMore = true
    while (hasMore) {
      const { data, error } = await client
        .from("setlist_entries")
        .select("entry_song")
        .in("entry_show", chunk)
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (error) throw error
      if (data?.length) {
        for (const row of data) {
          if (row.entry_song) heard.add(row.entry_song)
        }
        page++
        hasMore = data.length === PAGE_SIZE
      } else {
        hasMore = false
      }
    }
    onProgress((ci + 1) / chunks.length)
  }
  return heard
}

export async function processStands(
  client: SupabaseClient,
  attendedShowsData: AttendedShowJoined[]
): Promise<StandsAttended> {
  const attendedShowIds = new Set(
    attendedShowsData.filter((i) => i.shows).map((i) => i.shows!.show_id)
  )
  const userStands = new Set(
    attendedShowsData
      .filter((i) => i.shows?.show_stand)
      .map((i) => i.shows!.show_stand as string)
  )

  const standPromises = [...userStands].map(async (standName) => {
    const { data: allStandShows } = await client
      .from("shows")
      .select("show_id")
      .eq("show_stand", standName)

    if (!allStandShows?.length) return null
    const allStandShowIds = allStandShows.map((s) => s.show_id)
    const allAttended = allStandShowIds.every((id) => attendedShowIds.has(id))
    if (!allAttended) return null

    const { data: standData } = await client
      .from("stands")
      .select(
        `
          stand_category,
          stand_categories:stand_category (
            stand_category
          )
        `
      )
      .eq("stand", standName)
      .single()

    const row = standData as {
      stand_categories?: { stand_category?: string }
    } | null
    const cat = row?.stand_categories?.stand_category
    if (cat) {
      return {
        standName,
        info: { completed: true, category: cat },
      }
    }
    return null
  })

  const results = await Promise.all(standPromises)
  const standsAttended: StandsAttended = {}
  for (const r of results) {
    if (r) standsAttended[r.standName] = r.info
  }
  return standsAttended
}

export async function buildCategoryProgress(
  client: SupabaseClient,
  categoryLooseEnds: LooseEndRow[],
  allCategories: { category: string }[],
  attendedShowIds: string[],
  setLoadingProgress: (n: number) => void
): Promise<CategoryProgress> {
  const progress: CategoryProgress = {}
  if (categoryLooseEnds.length === 0) return progress

  const categoryMapping: Record<string, string> = {}
  for (const looseEnd of categoryLooseEnds) {
    const matchingCategory = allCategories.find(
      (cat) => cat.category.toLowerCase() === looseEnd.end.toLowerCase()
    )
    if (matchingCategory) {
      categoryMapping[looseEnd.end] = matchingCategory.category
    }
  }

  const categoryNames = [
    ...new Set(
      categoryLooseEnds.map((le) => categoryMapping[le.end] ?? le.end)
    ),
  ]

  const songsByCategory: Record<string, string[]> = {}
  for (const name of categoryNames) {
    songsByCategory[name] = []
  }

  if (categoryNames.length > 0) {
    let sPage = 0
    let sMore = true
    while (sMore) {
      const { data: songRows, error: songsError } = await client
        .from("songs")
        .select("song, song_category")
        .in("song_category", categoryNames)
        .range(sPage * PAGE_SIZE, (sPage + 1) * PAGE_SIZE - 1)

      if (songsError) throw songsError
      if (songRows?.length) {
        for (const r of songRows) {
          if (r.song_category && r.song) {
            if (!songsByCategory[r.song_category]) {
              songsByCategory[r.song_category] = []
            }
            songsByCategory[r.song_category].push(r.song)
          }
        }
        sPage++
        sMore = songRows.length === PAGE_SIZE
      } else {
        sMore = false
      }
    }
  }

  const unionSongs = [
    ...new Set(categoryNames.flatMap((n) => songsByCategory[n] ?? [])),
  ]

  setLoadingProgress(48)
  const canonicalShowIds = await fetchCanonicalShowIds(client)

  setLoadingProgress(50)
  const canonicallyPlayable = await collectCanonicallyPlayedSubset(
    client,
    canonicalShowIds,
    unionSongs,
    (frac) => setLoadingProgress(50 + Math.round(frac * 22))
  )

  setLoadingProgress(74)
  const heardSongs = await collectHeardSongNames(
    client,
    attendedShowIds,
    (frac) => {
      setLoadingProgress(74 + Math.round(frac * 21))
    }
  )

  for (const looseEnd of categoryLooseEnds) {
    const categoryName = categoryMapping[looseEnd.end] ?? looseEnd.end
    const songsInCategory = songsByCategory[categoryName] ?? []

    if (songsInCategory.length === 0) {
      progress[looseEnd.end] = { seen: 0, total: 10, percentage: 0 }
      continue
    }

    const playableSongs = songsInCategory.filter((s) =>
      canonicallyPlayable.has(s)
    )
    const totalPlayable = playableSongs.length

    if (totalPlayable === 0) {
      progress[looseEnd.end] = { seen: 0, total: 0, percentage: 0 }
      continue
    }

    let seenCount = 0
    for (const song of playableSongs) {
      if (heardSongs.has(song)) seenCount++
    }
    const percentage = Math.round((seenCount / totalPlayable) * 100)
    progress[looseEnd.end] = {
      seen: seenCount,
      total: totalPlayable,
      percentage,
    }
  }

  return progress
}
