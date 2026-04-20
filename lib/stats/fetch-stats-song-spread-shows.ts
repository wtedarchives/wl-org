import { supabase } from "@/lib/supabase"
import type { TourSongSpreadShowInput } from "@/lib/stats/tour-song-spread-compute"

const BATCH_SIZE = 100_000

type SpreadSetlistEntry = NonNullable<
  TourSongSpreadShowInput["setlist_entries"]
>[number]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyYearFilter(query: any, selectedYear: number | string): any {
  if (selectedYear === "all-time") return query
  return query
    .gte("shows.show_date", `${selectedYear}-01-01`)
    .lte("shows.show_date", `${selectedYear}-12-31`)
}

function firstOf<T>(rel: T | T[] | null | undefined): T | undefined {
  if (rel == null) return undefined
  return Array.isArray(rel) ? rel[0] : rel
}

function normalizeEntry(row: Record<string, unknown>): SpreadSetlistEntry {
  const songsRaw = row.songs
  const songObj = firstOf(
    songsRaw as Record<string, unknown> | Record<string, unknown>[] | null,
  )
  const catRaw = songObj?.categories
  const cat = firstOf(
    catRaw as Record<string, unknown> | Record<string, unknown>[] | null,
  )
  return {
    entry_song: String(row.entry_song ?? ""),
    entry_short: (row.entry_short as string | null) ?? null,
    songs: songObj
      ? {
          song_category: songObj.song_category as string | undefined,
          song_displayname: songObj.song_displayname as string | null | undefined,
          song_originalartist: songObj.song_originalartist as
            | string
            | null
            | undefined,
          categories: cat
            ? {
                category_canonid: cat.category_canonid as number | undefined,
              }
            : undefined,
        }
      : undefined,
  }
}

/**
 * Load Goose canon shows for the stats year (or all-time), grouped with setlist rows
 * for the same spread algorithm as the tour page.
 */
export async function fetchStatsSongSpreadShows(
  selectedYear: number | string,
): Promise<TourSongSpreadShowInput[]> {
  const client = supabase
  if (!client) return []

  const allRows: Record<string, unknown>[] = []
  let from = 0
  let hasMore = true
  while (hasMore) {
    let query = client
      .from("setlist_entries")
      .select(
        `
        entry_song,
        entry_short,
        entry_show,
        songs:entry_song(
          song_category,
          song_displayname,
          song_originalartist,
          categories(category_canonid)
        ),
        shows!inner(
          show_id,
          show_group,
          show_canonid
        )
      `,
      )
      .eq("shows.show_group", "Goose")
      .not("shows.show_canonid", "is", null)
    query = applyYearFilter(query, selectedYear)
    const { data, error } = await query.range(from, from + BATCH_SIZE - 1)
    if (error) throw error
    allRows.push(...(data || []))
    if (!data || data.length < BATCH_SIZE) hasMore = false
    else from += BATCH_SIZE
  }

  const byShow = new Map<string, NonNullable<TourSongSpreadShowInput["setlist_entries"]>>()

  for (const row of allRows) {
    const showRaw = row.shows
    const show = firstOf(
      showRaw as { show_id?: string } | { show_id?: string }[] | null,
    )
    const showId = show?.show_id
    if (!showId) continue
    const list = byShow.get(showId) ?? []
    list.push(normalizeEntry(row))
    byShow.set(showId, list)
  }

  return Array.from(byShow.entries()).map(([show_id, setlist_entries]) => ({
    show_id,
    setlist_entries,
  }))
}
