import type { RankingSongRef } from "@/lib/ranking-engine-edge"

export const RANKING_EXCLUDED_SONG_CATEGORY = "Cover Songs"

const PAGE_SIZE = 1000

type SetlistEntryPoolRow = {
  songs:
    | {
        song_id: string
        song: string
        song_category: string | null
        song_placeholder: boolean
        categories?:
          | { category_artwork?: string | null }
          | { category_artwork?: string | null }[]
          | null
      }
    | {
        song_id: string
        song: string
        song_category: string | null
        song_placeholder: boolean
        categories?:
          | { category_artwork?: string | null }
          | { category_artwork?: string | null }[]
          | null
      }[]
    | null
  shows: { show_canonid: number | null } | { show_canonid: number | null }[] | null
  setlist_entry_media:
    | { release_id: string | null }
    | { release_id: string | null }[]
    | null
}

function categoryArtworkFromRelation(
  relation:
    | { category_artwork?: string | null }
    | { category_artwork?: string | null }[]
    | null
    | undefined,
): string | null {
  const row = Array.isArray(relation) ? relation[0] : relation
  const url = row?.category_artwork
  return typeof url === "string" && url.trim() !== "" ? url.trim() : null
}

export function isRankingPoolSong(row: {
  song_category?: string | null
  song_placeholder?: boolean | null
}): boolean {
  return row.song_placeholder !== true &&
    (row.song_category ?? "") !== RANKING_EXCLUDED_SONG_CATEGORY
}

export async function fetchRankingSongPool(
  supabase: NonNullable<(typeof import("@/lib/supabase"))["supabase"]>,
): Promise<RankingSongRef[]> {
  const bySongId = new Map<string, RankingSongRef>()
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from("setlist_entries")
      .select(
        `
        songs!inner (
          song_id,
          song,
          song_category,
          song_placeholder,
          categories:song_category(category_artwork)
        ),
        shows!inner (
          show_canonid
        ),
        setlist_entry_media!inner (
          release_id
        )
      `,
      )
      .not("shows.show_canonid", "is", null)
      .not("setlist_entry_media.release_id", "is", null)
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      throw new Error("Failed to load song pool")
    }

    const rows = (data ?? []) as SetlistEntryPoolRow[]
    for (const row of rows) {
      const songsRel = row.songs
      const songRow = Array.isArray(songsRel) ? songsRel[0] : songsRel
      if (!songRow?.song_id || !isRankingPoolSong(songRow)) continue

      if (!bySongId.has(songRow.song_id)) {
        bySongId.set(songRow.song_id, {
          song_id: songRow.song_id,
          song: songRow.song,
          categoryArtwork: categoryArtworkFromRelation(songRow.categories ?? null),
        })
      }
    }

    if (rows.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return [...bySongId.values()].sort((a, b) => a.song.localeCompare(b.song))
}

export async function fetchRankingSongPoolIds(
  supabase: NonNullable<(typeof import("@/lib/supabase"))["supabase"]>,
): Promise<string[]> {
  const pool = await fetchRankingSongPool(supabase)
  return pool.map((song) => song.song_id)
}
