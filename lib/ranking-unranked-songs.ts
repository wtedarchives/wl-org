import type { RankingSongRef } from "@/lib/ranking-engine-edge"

const SONG_POOL_CATEGORY = "Everything Must Go"

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

export async function fetchUnrankedCatalogSongs(
  rankedSongIds: string[],
): Promise<RankingSongRef[]> {
  const { supabase } = await import("@/lib/supabase")
  if (!supabase) return []

  const { data, error } = await supabase
    .from("songs")
    .select("song_id, song, categories:song_category(category_artwork)")
    .eq("song_category", SONG_POOL_CATEGORY)
    .eq("song_placeholder", false)

  if (error) {
    throw new Error("Failed to load unranked songs")
  }

  const rankedSet = new Set(rankedSongIds)

  return (data ?? [])
    .filter((row) => !rankedSet.has(row.song_id))
    .map((row) => {
      const categoriesRel = row.categories as
        | { category_artwork?: string | null }
        | { category_artwork?: string | null }[]
        | null
      return {
        song_id: row.song_id,
        song: row.song,
        categoryArtwork: categoryArtworkFromRelation(categoriesRel),
      }
    })
    .sort((a, b) => a.song.localeCompare(b.song))
}
