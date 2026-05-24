"use client"

import { useEffect, useState } from "react"

import type { RankingConfirmedRank } from "@/lib/ranking-engine-edge"

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

export function useSongRankingsReadonly(userId: string | null | undefined) {
  const [loading, setLoading] = useState(true)
  const [ranks, setRanks] = useState<RankingConfirmedRank[]>([])
  const [hasResults, setHasResults] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      setHasResults(false)
      setRanks([])
      return
    }

    let cancelled = false

    void (async () => {
      const { supabase } = await import("@/lib/supabase")
      if (!supabase) {
        if (!cancelled) setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const { data: session, error: sessionError } = await supabase
        .from("ranking_sessions")
        .select("session_id")
        .eq("user_id", userId)
        .eq("status", "complete")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (cancelled) return

      if (sessionError) {
        setError("Failed to load rankings")
        setHasResults(false)
        setRanks([])
        setLoading(false)
        return
      }

      if (!session?.session_id) {
        setHasResults(false)
        setRanks([])
        setLoading(false)
        return
      }

      const { data: results, error: resultsError } = await supabase
        .from("ranking_results")
        .select("rank, song_id, songs(song, categories:song_category(category_artwork))")
        .eq("session_id", session.session_id)
        .order("rank", { ascending: true })

      if (cancelled) return

      if (resultsError) {
        setError("Failed to load rankings")
        setHasResults(false)
        setRanks([])
        setLoading(false)
        return
      }

      const mapped: RankingConfirmedRank[] = (results ?? []).map((row) => {
        const songsRel = row.songs as
          | {
              song: string
              categories?:
                | { category_artwork?: string | null }
                | { category_artwork?: string | null }[]
                | null
            }
          | {
              song: string
              categories?:
                | { category_artwork?: string | null }
                | { category_artwork?: string | null }[]
                | null
            }[]
          | null
        const songRow = Array.isArray(songsRel) ? songsRel[0] : songsRel
        return {
          song_id: row.song_id,
          song: songRow?.song ?? "",
          rank: row.rank,
          categoryArtwork: categoryArtworkFromRelation(songRow?.categories ?? null),
        }
      })

      setRanks(mapped)
      setHasResults(mapped.length > 0)
      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [userId])

  return { loading, ranks, hasResults, error, totalSlots: ranks.length }
}
