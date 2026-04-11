"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export interface PlacementRow {
  song_name: string
  song_displayname: string | null
  song_id: string
  times_played: number
  category_canonid: number
  song_categoryorder: number | null
  category_artwork?: string
}

const SHOW_OPENER = "Set 1 Opener"
const SET_OPENERS = [
  "Set 1 Opener",
  "Set 2 Opener",
  "Set 3 Opener",
  "Set 4 Opener",
  "Set 5 Opener",
  "Set 6 Opener",
]
const SET_CLOSERS = [
  "Set 1 Closer",
  "Set 2 Closer",
  "Set 3 Closer",
  "Set 4 Closer",
  "Set 5 Closer",
  "Set 6 Closer",
]
const ENCORES = ["Encore 1", "Encore 2", "Encore 3"]

async function fetchPlacement(
  sb: NonNullable<typeof supabase>,
  placement: string | string[],
): Promise<PlacementRow[]> {
  const BATCH = 2000
  let from = 0
  let hasMore = true
  const allData: any[] = []

  while (hasMore) {
    let query = sb
      .from("setlist_entries")
      .select(
        `
        entry_song,
        songs!inner(
          song_id,
          song_displayname,
          song_category,
          song_categoryorder,
          categories!inner(
            category_canonid,
            category_artwork
          )
        ),
        shows!inner(
          show_date,
          show_group,
          show_canonid
        )
      `,
      )
      .eq("shows.show_group", "Goose")
      .not("shows.show_canonid", "is", null)

    if (Array.isArray(placement)) {
      query = query.in("entry_placement", placement)
    } else {
      query = query.eq("entry_placement", placement)
    }

    const { data, error } = await query.range(from, from + BATCH - 1)
    if (error) throw error
    if (data && data.length > 0) {
      allData.push(...data)
      hasMore = data.length === BATCH
      from += BATCH
    } else {
      hasMore = false
    }
  }

  const counts = allData.reduce(
    (acc: Record<string, PlacementRow>, entry: any) => {
      const songName = entry.entry_song
      const songsRel = Array.isArray(entry.songs) ? entry.songs[0] : entry.songs
      if (!songsRel) return acc
      if (!acc[songName]) {
        const cat = songsRel.categories
        const catObj = Array.isArray(cat) ? cat[0] : cat
        acc[songName] = {
          song_name: songName,
          song_displayname: songsRel.song_displayname ?? null,
          song_id: songsRel.song_id,
          times_played: 1,
          category_canonid: catObj?.category_canonid ?? 0,
          song_categoryorder: songsRel.song_categoryorder ?? null,
          category_artwork: catObj?.category_artwork,
        }
      } else {
        acc[songName].times_played++
      }
      return acc
    },
    {},
  )

  return Object.values(counts)
    .sort((a, b) => {
      if (b.times_played !== a.times_played)
        return b.times_played - a.times_played
      if (a.category_canonid !== b.category_canonid)
        return a.category_canonid - b.category_canonid
      const orderA = a.song_categoryorder ?? 9999
      const orderB = b.song_categoryorder ?? 9999
      if (orderA !== orderB) return orderA - orderB
      return a.song_name.localeCompare(b.song_name)
    })
    .slice(0, 25)
}

export function usePopularPlacementsData() {
  const [showOpeners, setShowOpeners] = useState<PlacementRow[]>([])
  const [setOpeners, setSetOpeners] = useState<PlacementRow[]>([])
  const [setClosers, setSetClosers] = useState<PlacementRow[]>([])
  const [encores, setEncores] = useState<PlacementRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const client = supabase
    if (!client) {
      setLoading(false)
      return
    }

    async function fetchAll(sb: NonNullable<typeof supabase>) {
      setLoading(true)
      setError(null)
      try {
        const [so, sopen, sclose, enc] = await Promise.all([
          fetchPlacement(sb, SHOW_OPENER),
          fetchPlacement(sb, SET_OPENERS),
          fetchPlacement(sb, SET_CLOSERS),
          fetchPlacement(sb, ENCORES),
        ])
        setShowOpeners(so)
        setSetOpeners(sopen)
        setSetClosers(sclose)
        setEncores(enc)
        setProgress(100)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load placements")
        setShowOpeners([])
        setSetOpeners([])
        setSetClosers([])
        setEncores([])
      } finally {
        setLoading(false)
      }
    }

    fetchAll(client)
  }, [])

  return {
    showOpeners,
    setOpeners,
    setClosers,
    encores,
    loading,
    error,
    progress,
  }
}
