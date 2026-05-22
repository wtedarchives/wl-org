"use client"

import { useEffect, useState } from "react"

import { fetchSongTourPerformances } from "@/lib/fetch-song-tour-performances"
import { supabase } from "@/lib/supabase"
import type { Guest } from "@/types/setlist"

export interface SongPerformance {
  entry_id: string
  entry_set: string
  entry_setnum: number
  entry_placement: string
  entry_song: string
  entry_short: string | null
  entry_segue: string | null
  entry_length: string | null
  entry_coachnotes: string | null
  show_id: string
  show_date: string
  show_canonid: number | null
  show_subvenue: string
  show_venue_location: string
  show_subvenue_venue: string | null
  venue_id: string | null
  guests: Guest[]
}

export function useSongTourPerformances(
  open: boolean,
  songName: string | null,
  tourName: string | null,
) {
  const [performances, setPerformances] = useState<SongPerformance[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !songName || !tourName || !supabase) {
      setPerformances([])
      setLoading(false)
      setError(null)
      return
    }

    const client = supabase
    const resolvedSongName = songName
    const resolvedTourName = tourName
    let cancelled = false

    async function loadPerformances() {
      try {
        setLoading(true)
        setError(null)
        const mapped = await fetchSongTourPerformances(
          client,
          resolvedSongName,
          resolvedTourName,
        )
        if (!cancelled) setPerformances(mapped)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching song tour performances:", err)
        if (!cancelled) {
          setError("Unable to load performances.")
          setPerformances([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadPerformances()
    return () => {
      cancelled = true
    }
  }, [open, songName, tourName])

  return { performances, loading, error }
}
