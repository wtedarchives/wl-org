"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export interface VenueInfo {
  venue: string
  venue_location: string | null
  venue_address: string | null
  venue_latitude: string | null
  venue_longitude: string | null
}

export interface VenueShow {
  show_id: string
  show_date: string
  show_group: string
  show_subvenue: string
  show_tour: string | null
  tour_id: string | null
  show_detail: string | null
  show_alert: string | null
}

export interface SongSpreadCategory {
  category: string
  count: number
  canonid: number
  songs: {
    song: string
    song_displayname?: string | null
    playCount: number
    artist?: string
  }[]
}

const VENUE_LOAD_STEPS = 4

export function useVenueData(venueId: string | undefined) {
  const [venue, setVenue] = useState<VenueInfo | null>(null)
  const [shows, setShows] = useState<VenueShow[]>([])
  const [songSpreadData, setSongSpreadData] = useState<SongSpreadCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!venueId || !supabase) {
      setLoading(false)
      return
    }

    const client = supabase

    async function fetchVenueData() {
      setLoading(true)
      setProgress(0)
      setError(null)
      try {
        const { data: venueData, error: venueError } = await client
          .from("venues")
          .select("venue, venue_location, venue_address, venue_latitude, venue_longitude")
          .eq("venue_id", venueId)
          .single()

        if (venueError || !venueData) {
          throw new Error("Venue not found")
        }

        setVenue({
          venue: venueData.venue,
          venue_location: venueData.venue_location ?? null,
          venue_address: venueData.venue_address ?? null,
          venue_latitude: venueData.venue_latitude ?? null,
          venue_longitude: venueData.venue_longitude ?? null,
        })
        setProgress((1 / VENUE_LOAD_STEPS) * 100)

        const { data: showsData, error: showsError } = await client
          .from("shows")
          .select(
            `
            show_id,
            show_date,
            show_group,
            show_subvenue,
            show_tour,
            show_detail,
            show_alert,
            tours!show_tour(tour_id)
          `,
          )
          .eq("show_subvenue_venue", venueData.venue)
          .order("show_date", { ascending: true })

        if (showsError) throw showsError

        const rawShows = (showsData ?? []) as Array<{
          show_id: string
          show_date: string
          show_group: string
          show_subvenue: string
          show_tour: string | null
          show_detail: string | null
          show_alert: string | null
          tours?: { tour_id: string } | { tour_id: string }[] | null
        }>

        const processedShows: VenueShow[] = rawShows.map((s) => {
          const t = s.tours
          const tourId =
            t && !Array.isArray(t)
              ? t.tour_id
              : Array.isArray(t) && t[0]
                ? t[0].tour_id
                : null
          return {
            show_id: s.show_id,
            show_date: s.show_date,
            show_group: s.show_group,
            show_subvenue: s.show_subvenue,
            show_tour: s.show_tour,
            tour_id: tourId,
            show_detail: s.show_detail,
            show_alert: s.show_alert,
          }
        })

        setShows(processedShows)
        setProgress((2 / VENUE_LOAD_STEPS) * 100)

        if (processedShows.length === 0) {
          setSongSpreadData([])
          setProgress(100)
          return
        }

        const showIds = processedShows.map((s) => s.show_id)
        const chunks: string[][] = []
        for (let i = 0; i < showIds.length; i += 500) {
          chunks.push(showIds.slice(i, i + 500))
        }

        let allEntries: Array<{
          entry_song?: string
          entry_show?: string
          songs?: {
            song?: string
            song_category?: string
            song_originalartist?: string | null
            categories?: { category_canonid?: number }
          }
        }> = []

        for (const chunk of chunks) {
          let page = 0
          let hasMore = true
          while (hasMore) {
            const from = page * 1000
            const to = from + 999
            const { data: entriesData, error: entriesError } = await client
              .from("setlist_entries")
              .select(
                `
                entry_song,
                entry_show,
                songs:entry_song(
                  song,
                  song_displayname,
                  song_category,
                  song_originalartist,
                  categories:song_category(category_canonid)
                )
              `,
              )
              .in("entry_show", chunk)
              .range(from, to)

            if (entriesError) throw entriesError
            const batch = (entriesData ?? []) as typeof allEntries
            allEntries = [...allEntries, ...batch]
            hasMore = batch.length === 1000
            page++
          }
        }

        setProgress((3 / VENUE_LOAD_STEPS) * 100)

        const songData: Record<
          string,
          {
            count: number
            category: string
            categoryCanonId?: number
            originalArtist?: string | null
            songDisplayName?: string | null
          }
        > = {}

        for (const item of allEntries) {
          const songsRel = item.songs
          if (!songsRel?.song) continue

          const songName = songsRel.song
          const category = songsRel.song_category ?? "Uncategorized"
          const categoryCanonId = songsRel.categories?.category_canonid
          const originalArtist = songsRel.song_originalartist ?? null
          const songDisplayName = (songsRel as { song_displayname?: string })?.song_displayname ?? null

          if (!songData[songName]) {
            songData[songName] = {
              count: 0,
              category,
              categoryCanonId,
              originalArtist,
              songDisplayName,
            }
          }
          songData[songName].count += 1
        }

        const categories = [
          ...new Set(Object.values(songData).map((d) => d.category)),
        ]
        const categoryCanonIds: Record<string, number> = {}

        if (categories.length > 0) {
          const { data: categoryData } = await client
            .from("categories")
            .select("category, category_canonid")
            .in("category", categories)
          if (categoryData) {
            for (const cat of categoryData) {
              categoryCanonIds[cat.category] = cat.category_canonid ?? 9999
            }
          }
        }

        const songsArray = Object.entries(songData).map(([song, data]) => ({
          song,
          song_displayname: data.songDisplayName,
          play_count: data.count,
          category: data.category,
          category_canonid:
            data.categoryCanonId ?? categoryCanonIds[data.category] ?? 9999,
          original_artist: data.originalArtist,
        }))

        const categorySongs: Record<
          string,
          Array<{ song: string; song_displayname?: string | null; playCount: number; artist?: string }>
        > = {}
        const categoryTotalPerformances: Record<string, number> = {}

        for (const songItem of songsArray) {
          const category = songItem.category ?? "Uncategorized"
          if (!categorySongs[category]) {
            categorySongs[category] = []
            categoryTotalPerformances[category] = 0
          }
          const artist =
            songItem.original_artist?.trim() === "[Traditional]"
              ? "Traditional"
              : songItem.original_artist?.trim()
          categorySongs[category].push({
            song: songItem.song,
            song_displayname: songItem.song_displayname,
            playCount: songItem.play_count,
            artist: artist ?? undefined,
          })
          categoryTotalPerformances[category] += songItem.play_count
        }

        const spread: SongSpreadCategory[] = Object.keys(
          categoryTotalPerformances,
        ).map((category) => ({
          category,
          count: categoryTotalPerformances[category],
          canonid: categoryCanonIds[category] ?? 9999,
          songs: (categorySongs[category] ?? []).sort(
            (a, b) => b.playCount - a.playCount,
          ),
        }))
        spread.sort((a, b) => a.canonid - b.canonid)

        setSongSpreadData(spread)
        setProgress(100)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load venue")
        setVenue(null)
        setShows([])
        setSongSpreadData([])
      } finally {
        setLoading(false)
      }
    }

    fetchVenueData()
  }, [venueId])

  return {
    venue,
    shows,
    songSpreadData,
    loading,
    progress,
    error,
  }
}
