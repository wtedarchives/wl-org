"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { fetchSongWtedAirplayRows } from "@/lib/song-wted-airplay-fetch"
import type { SongWtedAirplayGroup } from "@/types/song-wted-airplay"

export function useSongWtedAirplay(songCanonical: string | null | undefined) {
  const [groups, setGroups] = useState<SongWtedAirplayGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const canonical = songCanonical?.trim() ?? ""
    if (!canonical) {
      setGroups([])
      setLoading(false)
      setError(null)
      return
    }
    if (!supabase) {
      setGroups([])
      setLoading(false)
      setError(null)
      return
    }
    const sb = supabase

    let cancelled = false

    async function run() {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchSongWtedAirplayRows(sb, canonical)
        if (!cancelled) setGroups(data)
      } catch (e) {
        if (!cancelled) {
          setGroups([])
          setError(e instanceof Error ? e.message : "Failed to load WTED data")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [songCanonical])

  return { groups, loading, error }
}
