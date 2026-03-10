"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export interface NotPlayedSong {
  song: string
  song_displayname?: string | null
  song_id: string
  play_count: number
  category_canonid: number
  category_artwork?: string
}

export function useNotPlayedInTour(
  tourId: string | undefined,
  tourName: string | undefined,
  showIds: string[],
): { notPlayedSongs: NotPlayedSong[]; isLoading: boolean } {
  const [notPlayedSongs, setNotPlayedSongs] = useState<NotPlayedSong[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!tourId || !tourName || !showIds.length || !supabase) {
      setIsLoading(false)
      return
    }
    const client = supabase

    async function fetchNotPlayedSongs() {
      try {
        const { data: tourFirstShowData, error: firstShowError } =
          await client
            .from("shows")
            .select("show_date")
            .eq("show_tour", tourName)
            .eq("show_group", "Goose")
            .not("show_canonid", "is", null)
            .order("show_date", { ascending: true })
            .limit(1)
            .single()

        if (firstShowError || !tourFirstShowData?.show_date) {
          setNotPlayedSongs([])
          setIsLoading(false)
          return
        }

        const firstShowDate = tourFirstShowData.show_date

        const { data: playedInTourData, error: playedError } = await client
          .from("setlist_entries")
          .select("songs!inner(song_id)")
          .in("entry_show", showIds)

        if (playedError) throw playedError

        const playedData = (playedInTourData ?? []) as Array<{
          songs?: { song_id?: string } | Array<{ song_id?: string }>
        }>
        const songsPlayedInTour = new Set(
          playedData
            .map((e) => {
              const s = e.songs
              return Array.isArray(s) ? s[0]?.song_id : s?.song_id
            })
            .filter(Boolean),
        )

        type EntryRow = {
          entry_song?: string
          entry_show?: string
          songs?:
            | { song_id?: string; categories?: { category_canonid?: number; category_artwork?: string } }
            | Array<{ song_id?: string; categories?: { category_canonid?: number; category_artwork?: string } }>
        }
        const allData: EntryRow[] = []
        let from = 0
        const batchSize = 1000
        let hasMore = true

        while (hasMore) {
          const { data, error } = await client
            .from("setlist_entries")
            .select(
              `
              entry_song,
              songs!inner(
                song_id,
                song_displayname,
                song_category,
                categories!inner(
                  category_canonid,
                  category_artwork
                )
              ),
              entry_show,
              shows!inner(
                show_date,
                show_group,
                show_canonid
              )
            `,
            )
            .eq("shows.show_group", "Goose")
            .not("shows.show_canonid", "is", null)
            .lt("shows.show_date", firstShowDate)
            .range(from, from + batchSize - 1)

          if (error) throw error
          allData.push(...((data ?? []) as EntryRow[]))
          if (!data || data.length < batchSize) hasMore = false
          else from += batchSize
        }

        const songShowCounts: Record<
          string,
          {
            song: string
            song_displayname?: string | null
            song_id: string
            shows: Set<string>
            category_canonid: number
            category_artwork?: string
          }
        > = {}

        for (const entry of allData) {
          const songsVal = entry.songs
          const songRow = Array.isArray(songsVal) ? songsVal[0] : songsVal
          const categoriesVal = songRow?.categories
          const categories = Array.isArray(categoriesVal)
            ? categoriesVal[0]
            : categoriesVal
          const songId = songRow?.song_id
          const showId = entry.entry_show
          if (!songId || !showId) continue
          if (!songShowCounts[songId]) {
            songShowCounts[songId] = {
              song: entry.entry_song ?? "",
              song_displayname: (songRow as { song_displayname?: string })?.song_displayname ?? null,
              song_id: songId,
              shows: new Set([showId]),
              category_canonid: categories?.category_canonid ?? 0,
              category_artwork: categories?.category_artwork,
            }
          } else {
            songShowCounts[songId].shows.add(showId)
          }
        }

        const processed = Object.values(songShowCounts)
          .filter((item) => !songsPlayedInTour.has(item.song_id))
          .map((item) => ({
            song: item.song,
            song_displayname: item.song_displayname,
            song_id: item.song_id,
            play_count: item.shows.size,
            category_canonid: item.category_canonid,
            category_artwork: item.category_artwork,
          }))
          .sort((a, b) => {
            if (b.play_count !== a.play_count)
              return b.play_count - a.play_count
            if (a.category_canonid !== b.category_canonid)
              return a.category_canonid - b.category_canonid
            return a.song.localeCompare(b.song)
          })
          .slice(0, 8)

        setNotPlayedSongs(processed)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching not played songs:", err)
        setNotPlayedSongs([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotPlayedSongs()
  }, [tourId, tourName, showIds.join(",")])

  return { notPlayedSongs, isLoading }
}
