"use client"

import { useEffect, useState } from "react"
import {
  aggregatePerformersBySong,
  type SetlistEntryShowRow,
} from "@/lib/songs-performer-groups"
import { supabase } from "@/lib/supabase"

const BATCH_SIZE = 1000

export interface SongsArchiveSong {
  song: string
  song_displayname?: string | null
  song_category: string
  song_originalartist: string
  song_id: string
  song_categoryorder: number
}

export interface SongsArchiveCategory {
  category: string
  category_canonid: number
  category_display_name: string
  category_color1: string
  category_color2: string
  category_artwork: string
  category_type: string
}

export function useSongsArchiveData() {
  const [categories, setCategories] = useState<SongsArchiveCategory[]>([])
  const [songs, setSongs] = useState<SongsArchiveSong[]>([])
  const [performerBySong, setPerformerBySong] = useState<
    Record<string, string[]>
  >({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      setError(true)
      return
    }
    const db = supabase

    async function fetchData() {
      setLoading(true)
      setError(false)
      try {
        const { data: categoriesData, error: catError } = await db
          .from("categories")
          .select("*")
          .order("category_canonid", { ascending: true })

        if (catError) throw catError

        const { count, error: countError } = await db
          .from("songs")
          .select("*", { count: "exact", head: true })
          .eq("song_placeholder", false)

        if (countError) throw countError

        const songTotal = count ?? 0
        const totalBatches =
          songTotal > 0 ? Math.ceil(songTotal / BATCH_SIZE) : 0
        let allSongsData: SongsArchiveSong[] = []

        for (let i = 0; i < totalBatches; i++) {
          const start = i * BATCH_SIZE
          const end = Math.min(start + BATCH_SIZE - 1, songTotal - 1)

          const { data, error: batchError } = await db
            .from("songs")
            .select("*")
            .eq("song_placeholder", false)
            .order("song_categoryorder", { ascending: true })
            .range(start, end)

          if (batchError) throw batchError
          if (data) allSongsData = [...allSongsData, ...data]
        }

        setSongs(allSongsData)
        setCategories((categoriesData as SongsArchiveCategory[]) ?? [])

        try {
          const { count: entryCount, error: entryCountError } = await db
            .from("setlist_entries")
            .select("*", { count: "exact", head: true })

          if (entryCountError) throw entryCountError

          const entryTotal = entryCount ?? 0
          const allEntryRows: SetlistEntryShowRow[] = []

          if (entryTotal > 0) {
            const entryBatches = Math.ceil(entryTotal / BATCH_SIZE)
            for (let j = 0; j < entryBatches; j++) {
              const eStart = j * BATCH_SIZE
              const eEnd = Math.min(eStart + BATCH_SIZE - 1, entryTotal - 1)

              const { data: entryData, error: entryBatchError } = await db
                .from("setlist_entries")
                .select("entry_song, shows(show_group)")
                .range(eStart, eEnd)

              if (entryBatchError) throw entryBatchError
              if (entryData?.length) {
                allEntryRows.push(
                  ...(entryData as unknown as SetlistEntryShowRow[])
                )
              }
            }
          }

          setPerformerBySong(aggregatePerformersBySong(allEntryRows))
        } catch (entryErr) {
          console.error("Songs list: setlist_entries fetch failed", entryErr)
          setPerformerBySong({})
        }
      } catch {
        setError(true)
        setSongs([])
        setCategories([])
        setPerformerBySong({})
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { categories, songs, performerBySong, loading, error }
}
