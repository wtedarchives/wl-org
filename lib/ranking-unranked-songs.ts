import { fetchRankingSongPool } from "@/lib/ranking-song-pool"
import type { RankingSongRef } from "@/lib/ranking-engine-edge"

export async function fetchUnrankedCatalogSongs(
  rankedSongIds: string[],
): Promise<RankingSongRef[]> {
  const { supabase } = await import("@/lib/supabase")
  if (!supabase) return []

  const rankedSet = new Set(rankedSongIds)
  const pool = await fetchRankingSongPool(supabase)

  return pool.filter((song) => !rankedSet.has(song.song_id))
}
