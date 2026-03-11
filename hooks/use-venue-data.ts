"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export interface VenueDetail {
  venue: string
  venue_location: string
  venue_id: string
  venue_address: string | null
  venue_latitude: string | null
  venue_longitude: string | null
}

export interface VenueShow {
  show_id: string
  show_date: string
  show_group: string
  show_subvenue: string
  show_venue_location: string
  show_tour: string | null
  tour_id: string | null
  venue_id: string | null
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

const PAGE_SIZE = 1000
const VENUE_LOAD_STEPS = 3

function isUuid(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export function useVenueData(venueId: string | undefined) {
  const [venue, setVenue] = useState<VenueDetail | null>(null)
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
      if (!venueId) return
      setLoading(true)
      setProgress(0)
      setError(null)
      try {
        let venueData: VenueDetail | null = null

        if (isUuid(venueId)) {
          const { data, error: venueError } = await client
            .from("venues")
            .select(
              "venue, venue_location, venue_id, venue_address, venue_latitude, venue_longitude"
            )
            .eq("venue_id", venueId)
            .single()
          if (!venueError && data) {
            venueData = data as VenueDetail
          }
        }

        if (!venueData) {
          const decodedName = decodeURIComponent(venueId)
          const { data, error: venueError } = await client
            .from("venues")
            .select(
              "venue, venue_location, venue_id, venue_address, venue_latitude, venue_longitude"
            )
            .eq("venue", decodedName)
            .maybeSingle()
          if (!venueError && data) {
            venueData = data as VenueDetail
          }
        }

        if (!venueData) {
          setVenue(null)
          setShows([])
          setSongSpreadData([])
          setError("Venue not found")
          setLoading(false)
          return
        }

        setVenue(venueData)
        setProgress((1 / VENUE_LOAD_STEPS) * 100)

        const venueName = venueData.venue

        const { data: subvenuesData } = await client
          .from("subvenues")
          .select("subvenue")
          .eq("subvenue_venue", venueName)

        const subvenueNames =
          subvenuesData?.map((s) => s.subvenue) ?? []

        if (subvenueNames.length === 0) {
          setShows([])
          setSongSpreadData([])
          setProgress(100)
          setLoading(false)
          return
        }

        let allShowsData: Array<{
          show_id: string
          show_date: string
          show_group: string
          show_subvenue: string
          show_venue_location: string
          show_tour: string | null
          show_detail: string | null
          show_alert: string | null
          subvenues?: { venues?: { venue_id?: string } } | null
        }> = []
        let page = 0
        let hasMore = true

        while (hasMore) {
          const { data, error: showsError } = await client
            .from("shows")
            .select(
              `
              show_id,
              show_date,
              show_group,
              show_subvenue,
              show_venue_location,
              show_tour,
              show_detail,
              show_alert,
              subvenues:show_subvenue(
                venues:subvenue_venue(venue_id)
              )
            `
            )
            .in("show_subvenue", subvenueNames)
            .order("show_date", { ascending: false })
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

          if (showsError) throw showsError
          if (data && data.length > 0) {
            allShowsData = [...allShowsData, ...(data as typeof allShowsData)]
            page++
            hasMore = data.length === PAGE_SIZE
          } else {
            hasMore = false
          }
        }

        const processedShows: VenueShow[] = allShowsData.map((s) => {
          const sub = Array.isArray(s.subvenues) ? s.subvenues[0] : s.subvenues
          const ven = Array.isArray(sub?.venues) ? sub?.venues?.[0] : sub?.venues
          return {
            show_id: s.show_id,
            show_date: s.show_date,
            show_group: s.show_group ?? "",
            show_subvenue: s.show_subvenue ?? "",
            show_venue_location: s.show_venue_location ?? "",
            show_tour: s.show_tour ?? null,
            tour_id: null,
            venue_id: ven?.venue_id ?? venueData.venue_id,
            show_detail: s.show_detail ?? null,
            show_alert: s.show_alert ?? null,
          }
        })

        setShows(processedShows)
        setProgress((2 / VENUE_LOAD_STEPS) * 100)

        const showIds = processedShows.map((s) => s.show_id)
        if (showIds.length === 0) {
          setSongSpreadData([])
          setProgress(100)
          setLoading(false)
          return
        }

        type EntryRow = {
          entry_song?: string
          songs?: {
            song?: string
            song_displayname?: string | null
            song_category?: string
            song_originalartist?: string | null
            categories?: { category_canonid?: number }
          } | Array<{
            song?: string
            song_displayname?: string | null
            song_category?: string
            song_originalartist?: string | null
            categories?: { category_canonid?: number }
          }>
        }

        let allEntries: EntryRow[] = []
        let entryPage = 0
        let entriesHasMore = true

        while (entriesHasMore) {
          const { data: entriesData, error: entriesError } = await client
            .from("setlist_entries")
            .select(
              `
              entry_song,
              songs:entry_song(
                song,
                song_displayname,
                song_category,
                song_originalartist,
                categories:song_category(category_canonid)
              )
            `
            )
            .in("entry_show", showIds)
            .range(entryPage * PAGE_SIZE, (entryPage + 1) * PAGE_SIZE - 1)

          if (entriesError) throw entriesError
          if (entriesData && entriesData.length > 0) {
            allEntries = [...allEntries, ...(entriesData as EntryRow[])]
            entryPage++
            entriesHasMore = entriesData.length === PAGE_SIZE
          } else {
            entriesHasMore = false
          }
        }

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
          const songsVal = Array.isArray(songsRel) ? songsRel[0] : songsRel
          if (!songsVal?.song) continue

          const songName = songsVal.song
          const songDisplayName = songsVal.song_displayname ?? null
          const category = songsVal.song_category ?? "Uncategorized"
          const categoryCanonId = songsVal.categories?.category_canonid
          const originalArtist = songsVal.song_originalartist ?? null

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

        const categorySongs: Record<
          string,
          Array<{
            song: string
            song_displayname?: string | null
            playCount: number
            artist?: string
          }>
        > = {}
        const categoryTotalPerformances: Record<string, number> = {}

        for (const [song, data] of Object.entries(songData)) {
          const category = data.category ?? "Uncategorized"
          if (!categorySongs[category]) {
            categorySongs[category] = []
            categoryTotalPerformances[category] = 0
          }
          const artist =
            data.originalArtist?.trim() === "[Traditional]"
              ? "Traditional"
              : data.originalArtist?.trim()
          categorySongs[category].push({
            song,
            song_displayname: data.songDisplayName ?? null,
            playCount: data.count,
            artist: artist ?? undefined,
          })
          categoryTotalPerformances[category] += data.count
        }

        const spreadData: SongSpreadCategory[] = Object.keys(
          categoryTotalPerformances
        ).map((category) => ({
          category,
          count: categoryTotalPerformances[category],
          canonid: categoryCanonIds[category] ?? 9999,
          songs: (categorySongs[category] ?? []).sort(
            (a, b) => b.playCount - a.playCount
          ),
        }))
        spreadData.sort((a, b) => a.canonid - b.canonid)

        setSongSpreadData(spreadData)
        setProgress(100)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load venue data")
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
