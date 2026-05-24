import type { RankingSongRef } from "@/lib/ranking-engine-edge"

const PAGE_SIZE = 1000

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

export async function fetchRankingSongPool(
  supabase: NonNullable<(typeof import("@/lib/supabase"))["supabase"]>,
): Promise<RankingSongRef[]> {
  const pool: RankingSongRef[] = []
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from("songs")
      .select("song_id, song, categories:song_category(category_artwork)")
      .eq("song_rankable", true)
      .order("song", { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      throw new Error("Failed to load song pool")
    }

    const rows = data ?? []
    for (const row of rows) {
      const categoriesRel = row.categories as
        | { category_artwork?: string | null }
        | { category_artwork?: string | null }[]
        | null
      pool.push({
        song_id: row.song_id,
        song: row.song,
        categoryArtwork: categoryArtworkFromRelation(categoriesRel),
      })
    }

    if (rows.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return pool
}

export async function fetchRankingSongPoolIds(
  supabase: NonNullable<(typeof import("@/lib/supabase"))["supabase"]>,
): Promise<string[]> {
  const pool = await fetchRankingSongPool(supabase)
  return pool.map((song) => song.song_id)
}
