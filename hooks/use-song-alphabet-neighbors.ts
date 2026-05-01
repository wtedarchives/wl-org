"use client"

import { useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

const BATCH = 1000

export interface SongAlphabetNeighbors {
  prev: { song_id: string; song_displayname: string | null; song: string } | null
  next: { song_id: string; song_displayname: string | null; song: string } | null
}

export function useSongAlphabetNeighbors(currentSongId: string | undefined) {
  const [neighbors, setNeighbors] = useState<SongAlphabetNeighbors>({
    prev: null,
    next: null,
  })

  useEffect(() => {
    if (!currentSongId || !supabase) return

    let cancelled = false
    const sb = supabase

    async function run() {
      try {
        const { count, error: countError } = await sb
          .from("songs")
          .select("*", { count: "exact", head: true })
          .eq("song_placeholder", false)

        if (countError) throw countError

        const rows: Array<{
          song_id: string
          song: string
          song_displayname: string | null
        }> = []
        const total = count ?? 0
        const batches = Math.ceil(total / BATCH)

        for (let i = 0; i < batches; i++) {
          const start = i * BATCH
          const end = Math.min(start + BATCH - 1, Math.max(total - 1, 0))
          const { data, error } = await sb
            .from("songs")
            .select("song_id, song, song_displayname")
            .eq("song_placeholder", false)
            .order("song_displayname", { ascending: true, nullsFirst: false })
            .order("song", { ascending: true })
            .range(start, end)

          if (error) throw error
          if (data?.length) rows.push(...data)
        }

        const byId = new Map(rows.map((r) => [r.song_id, r]))
        const sorted = [...byId.values()].sort((a, b) => {
          const da = (a.song_displayname ?? a.song).trim()
          const db = (b.song_displayname ?? b.song).trim()
          const c = da.localeCompare(db, undefined, { sensitivity: "base" })
          if (c !== 0) return c
          return a.song.localeCompare(b.song)
        })

        const idx = sorted.findIndex((r) => r.song_id === currentSongId)
        if (cancelled || idx < 0) {
          if (!cancelled) setNeighbors({ prev: null, next: null })
          return
        }

        setNeighbors({
          prev:
            idx > 0 ?
              {
                song_id: sorted[idx - 1].song_id,
                song: sorted[idx - 1].song,
                song_displayname: sorted[idx - 1].song_displayname,
              }
            : null,
          next:
            idx < sorted.length - 1 ?
              {
                song_id: sorted[idx + 1].song_id,
                song: sorted[idx + 1].song,
                song_displayname: sorted[idx + 1].song_displayname,
              }
            : null,
        })
      } catch {
        if (!cancelled) setNeighbors({ prev: null, next: null })
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [currentSongId])

  return neighbors
}
