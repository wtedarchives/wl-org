"use client"

import { useEffect, useState } from "react"

import { fetchSongTourPerformances } from "@/lib/fetch-song-tour-performances"
import { uniqueSongEntriesForPairModal } from "@/lib/song-pairs"
import { supabase } from "@/lib/supabase"
import type { SongPerformance } from "@/hooks/use-song-tour-performances"
import type { SetlistEntry } from "@/types/setlist"

export type SongTourPerformanceSection = {
  entry: SetlistEntry
  performances: SongPerformance[]
}

export function useMultiSongTourPerformances(
  open: boolean,
  entries: SetlistEntry[],
  tourName: string | null,
) {
  const [sections, setSections] = useState<SongTourPerformanceSection[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uniqueEntries = uniqueSongEntriesForPairModal(entries)
  const entryKey = uniqueEntries.map((entry) => entry.entry_id).join("|")

  useEffect(() => {
    if (!open || uniqueEntries.length === 0 || !tourName || !supabase) {
      setSections([])
      setLoading(false)
      setError(null)
      return
    }

    const client = supabase
    const resolvedTourName = tourName
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const results = await Promise.all(
          uniqueEntries.map(async (entry) => ({
            entry,
            performances: await fetchSongTourPerformances(
              client,
              entry.entry_song,
              resolvedTourName,
            ),
          })),
        )
        if (!cancelled) setSections(results)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching multi-song tour performances:", err)
        if (!cancelled) {
          setError("Unable to load performances.")
          setSections([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable key from entry ids
  }, [open, entryKey, tourName])

  return { sections, loading, error }
}
