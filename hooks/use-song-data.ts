"use client"

import { useQuery } from "@tanstack/react-query"

import { EMPTY_STATS, fetchSongCore } from "@/lib/archive/fetch-song-core"
import { archiveQueryKeys } from "@/lib/archive-query-keys"
import { supabase } from "@/lib/supabase"
import type {
  LastPlayed,
  PlacementStat,
  SongData,
  SongPerformance,
  SongStats,
} from "@/types/song"

export function useSongData(songId: string | undefined) {
  const {
    data,
    isLoading: queryLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: archiveQueryKeys.songCore(songId ?? ""),
    queryFn: () => fetchSongCore(songId!),
    enabled: Boolean(songId && supabase),
  })

  const song: SongData | null = data?.song ?? null
  const performances: SongPerformance[] = data?.performances ?? []
  const stats: SongStats = data?.stats ?? EMPTY_STATS
  const placementStats: PlacementStat[] = data?.placementStats ?? []
  const lastPlayed: LastPlayed | null = data?.lastPlayed ?? null
  const loading = Boolean(songId && supabase && queryLoading)
  const errorMessage = isError
    ? error instanceof Error
      ? error.message
      : "Failed to load song"
    : null
  const progress = loading && isFetching ? 50 : undefined

  return {
    song,
    songName: song?.song ?? null,
    performances,
    stats,
    placementStats,
    lastPlayed,
    loading,
    error: errorMessage,
    progress,
  }
}
