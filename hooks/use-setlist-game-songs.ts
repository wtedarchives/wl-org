"use client"

import { useEffect, useState } from "react"

import type { Song } from "@/components/dpro/setlistgame/song-selection/types"
import { fetchSetlistGameSongs } from "@/lib/fetch-setlist-game-songs"

export function useSetlistGameSongs(): {
  songs: Song[]
  loading: boolean
  error: string | null
} {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchSetlistGameSongs()
        if (!cancelled) setSongs(data)
      } catch (err) {
        console.error("Error fetching setlist game songs:", err)
        if (!cancelled) {
          setSongs([])
          setError("Failed to load songs. Please try again.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return { songs, loading, error }
}
