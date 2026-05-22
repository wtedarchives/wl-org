"use client"

import { useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"
import type { SongPair } from "@/types/song-pair"

let songPairsCache: SongPair[] | null = null
let songPairsFetch: Promise<SongPair[]> | null = null

async function loadSongPairs(): Promise<SongPair[]> {
  if (songPairsCache) return songPairsCache
  if (songPairsFetch) return songPairsFetch

  songPairsFetch = (async () => {
    if (!supabase) {
      songPairsCache = []
      return songPairsCache
    }

    try {
      const { data, error } = await supabase
        .from("song_pairs")
        .select("uuid, song_1, song_2, song_3, song_4, alt_name")

      if (error) throw error
      songPairsCache = (data ?? []) as SongPair[]
    } catch {
      songPairsCache = []
    }

    return songPairsCache
  })()

  return songPairsFetch
}

export function useSongPairs() {
  const [songPairs, setSongPairs] = useState<SongPair[]>(songPairsCache ?? [])
  const [loading, setLoading] = useState(songPairsCache === null)

  useEffect(() => {
    if (songPairsCache) {
      setSongPairs(songPairsCache)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    void loadSongPairs().then((pairs) => {
      if (cancelled) return
      setSongPairs(pairs)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  return { songPairs, loading }
}
