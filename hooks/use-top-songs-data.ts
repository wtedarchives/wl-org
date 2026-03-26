"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { SongStat } from "./use-setlist-game-show-data"

async function fetchSongMetadata() {
  if (!supabase)
    return {
      songIdMap: {} as Record<string, string>,
      categoryArtworkMap: {} as Record<string, string>,
      categoryIdMap: {} as Record<string, number>,
      songDisplayNameMap: {} as Record<string, string | null>,
    }

  const { count } = await supabase
    .from("songs")
    .select("*", { count: "exact", head: true })

  const batchSize = 1000
  const totalBatches = Math.ceil((count ?? 0) / batchSize)
  const songIdMap: Record<string, string> = {}
  const categoryArtworkMap: Record<string, string> = {}
  const categoryIdMap: Record<string, number> = {}
  const songDisplayNameMap: Record<string, string | null> = {}

  for (let i = 0; i < totalBatches; i++) {
    const { data } = await supabase
      .from("songs")
      .select(
        "song, song_id, song_displayname, song_category, categories:song_category(category_canonid, category_artwork)"
      )
      .order("song", { ascending: true })
      .range(i * batchSize, (i + 1) * batchSize - 1)

    data?.forEach((s) => {
      songIdMap[s.song] = s.song_id ?? ""
      songDisplayNameMap[s.song] =
        (s as { song_displayname?: string | null }).song_displayname ?? null
      const cat = s.categories as { category_canonid?: number; category_artwork?: string } | null
      if (cat) {
        categoryIdMap[s.song] = cat.category_canonid ?? 0
        categoryArtworkMap[s.song] = cat.category_artwork ?? ""
      }
    })
  }

  return { songIdMap, categoryArtworkMap, categoryIdMap, songDisplayNameMap }
}

function buildSongStats(
  songCounts: Record<string, number>,
  submissionCount: number,
  songIdMap: Record<string, string>,
  categoryIdMap: Record<string, number>,
  categoryArtworkMap: Record<string, string>,
  songDisplayNameMap: Record<string, string | null>
): SongStat[] {
  return Object.entries(songCounts).map(([song, count]) => ({
    song,
    song_displayname: songDisplayNameMap[song] ?? null,
    count,
    percentage: Math.round((count / submissionCount) * 100),
    categoryId: categoryIdMap[song] ?? 0,
    song_id: songIdMap[song] ?? "",
    category_artwork: categoryArtworkMap[song] ?? "",
  }))
}

function sortSongStats(stats: SongStat[]): SongStat[] {
  return [...stats].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count
    if ((a.categoryId ?? 0) !== (b.categoryId ?? 0))
      return (a.categoryId ?? 0) - (b.categoryId ?? 0)
    return a.song.localeCompare(b.song)
  })
}

export function useTopSongsData(showId: string | undefined): SongStat[] {
  const [topSongs, setTopSongs] = useState<SongStat[]>([])

  useEffect(() => {
    async function fetch() {
      if (!showId || !supabase) return

      const { data: submissionsData } = await supabase
        .from("setlist_game_submissions")
        .select("submission_id")
        .eq("show_id", showId)

      if (!submissionsData?.length) {
        setTopSongs([])
        return
      }

      const submissionIds = submissionsData.map((s) => s.submission_id)
      const { data: picksData } = await supabase
        .from("setlist_game_picks")
        .select("song")
        .in("submission_id", submissionIds)

      const songCounts: Record<string, number> = {}
      picksData?.forEach((p) => {
        songCounts[p.song] = (songCounts[p.song] ?? 0) + 1
      })

      const { songIdMap, categoryArtworkMap, categoryIdMap, songDisplayNameMap } =
        await fetchSongMetadata()

      const stats = buildSongStats(
        songCounts,
        submissionsData.length,
        songIdMap,
        categoryIdMap,
        categoryArtworkMap,
        songDisplayNameMap
      )
      setTopSongs(sortSongStats(stats).slice(0, 8))
    }

    fetch()
  }, [showId])

  return topSongs
}

export function useTopOpenersData(showId: string | undefined): SongStat[] {
  const [topOpeners, setTopOpeners] = useState<SongStat[]>([])

  useEffect(() => {
    async function fetch() {
      if (!showId || !supabase) return

      const { data: submissionsData } = await supabase
        .from("setlist_game_submissions")
        .select("submission_id")
        .eq("show_id", showId)

      if (!submissionsData?.length) {
        setTopOpeners([])
        return
      }

      const submissionIds = submissionsData.map((s) => s.submission_id)
      const { data: picksData } = await supabase
        .from("setlist_game_picks")
        .select("song")
        .in("submission_id", submissionIds)
        .eq("placement", "Set 1 Opener")

      const songCounts: Record<string, number> = {}
      picksData?.forEach((p) => {
        songCounts[p.song] = (songCounts[p.song] ?? 0) + 1
      })

      const { songIdMap, categoryArtworkMap, categoryIdMap, songDisplayNameMap } =
        await fetchSongMetadata()

      const stats = buildSongStats(
        songCounts,
        submissionsData.length,
        songIdMap,
        categoryIdMap,
        categoryArtworkMap,
        songDisplayNameMap
      )
      setTopOpeners(sortSongStats(stats).slice(0, 8))
    }

    fetch()
  }, [showId])

  return topOpeners
}

export function useTopClosersData(showId: string | undefined): SongStat[] {
  const [topClosers, setTopClosers] = useState<SongStat[]>([])

  useEffect(() => {
    async function fetch() {
      if (!showId || !supabase) return

      const { data: submissionsData } = await supabase
        .from("setlist_game_submissions")
        .select("submission_id")
        .eq("show_id", showId)

      if (!submissionsData?.length) {
        setTopClosers([])
        return
      }

      const closerSongs: Record<string, number> = {}

      for (const sub of submissionsData) {
        const { data: lastPick } = await supabase
          .from("setlist_game_picks")
          .select("song")
          .eq("submission_id", sub.submission_id)
          .order("set", { ascending: false })
          .order("setnum", { ascending: false })
          .limit(1)

        if (lastPick?.[0]) {
          const song = lastPick[0].song
          closerSongs[song] = (closerSongs[song] ?? 0) + 1
        }
      }

      const { songIdMap, categoryArtworkMap, categoryIdMap, songDisplayNameMap } =
        await fetchSongMetadata()

      const stats = buildSongStats(
        closerSongs,
        submissionsData.length,
        songIdMap,
        categoryIdMap,
        categoryArtworkMap,
        songDisplayNameMap
      )
      setTopClosers(sortSongStats(stats).slice(0, 8))
    }

    fetch()
  }, [showId])

  return topClosers
}
