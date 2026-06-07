"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { isRecordingSessionEmbedShow } from "@/lib/show-recording-session-filter"

export interface GuestInfo {
  guest: string
  guest_category: string
  guest_instrument: string | null
  guest_displayname: string | null
}

export interface GuestShow {
  show_id: string
  show_date: string
  show_group: string
  show_subvenue: string
  show_venue_location: string
  show_tour: string | null
  tour_id: string | null
  venue_id: string | null
}

export interface SongCount {
  song: string
  song_displayname?: string | null
  play_count: number
  category?: string
  category_canonid?: number
  original_artist?: string | null
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

const GUEST_LOAD_STEPS = 3 // guest, entries, processing

export function useGuestData(guestId: string | undefined) {
  const [guest, setGuest] = useState<GuestInfo | null>(null)
  const [performances, setPerformances] = useState<GuestShow[]>([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [songShowMap, setSongShowMap] = useState<Record<string, string[]>>({})
  const [songs, setSongs] = useState<SongCount[]>([])
  const [songSpreadData, setSongSpreadData] = useState<SongSpreadCategory[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!guestId || !supabase) {
      setLoading(false)
      return
    }
    const client = supabase

    async function fetchAllGuestData() {
      setLoading(true)
      setProgress(0)
      setError(null)
      try {
        const { data: guestData, error: guestError } = await client
          .from("guests")
          .select("guest, guest_category, guest_instrument, guest_displayname")
          .eq("guest_id", guestId)
          .single()

        if (guestError) throw guestError
        if (!guestData) {
          setGuest(null)
          setLoading(false)
          return
        }

        setGuest({
          guest: guestData.guest,
          guest_category: guestData.guest_category,
          guest_instrument: guestData.guest_instrument ?? null,
          guest_displayname: guestData.guest_displayname ?? null,
        })
        setProgress((1 / GUEST_LOAD_STEPS) * 100)

        let allEntries: Array<{
          setlist_entries?: {
            entry_song?: string
            entry_show?: string
            songs?: {
              song?: string
              song_displayname?: string | null
              song_category?: string
              song_originalartist?: string | null
              categories?: { category_canonid?: number } }
            shows?: {
              show_id: string
              show_date: string
              show_group: string
              show_subvenue: string
              show_venue_location: string
              show_tour: string | null
              show_detail?: string | null
              tour_id?: string | null
              subvenues?: { venues?: { venue_id?: string } } | null
            }
          }
        }> = []
        let page = 0
        let hasMore = true

        while (hasMore) {
          const { data, error: entriesError } = await client
            .from("setlist_entry_guests")
            .select(
              `
              setlist_entry_id,
              setlist_entries:setlist_entry_id(
                entry_song,
                entry_show,
                songs:entry_song(
                  song,
                  song_displayname,
                  song_category,
                  song_originalartist,
                  categories:song_category(
                    category_canonid
                  )
                ),
                shows:entry_show(
                  show_id,
                  show_date,
                  show_group,
                  show_subvenue,
              show_venue_location,
              show_tour,
              show_detail,
              subvenues:show_subvenue(
                    venues:subvenue_venue(
                      venue_id
                    )
                  )
                )
              )
            `,
            )
            .eq("guest_id", guestId)
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

          if (entriesError) throw entriesError
          if (data && data.length > 0) {
            allEntries = [...allEntries, ...(data as typeof allEntries)]
            page++
            hasMore = data.length === PAGE_SIZE
          } else {
            hasMore = false
          }
        }

        setProgress((2 / GUEST_LOAD_STEPS) * 100)

        const visibleEntries = allEntries.filter((item) => {
          const show = item.setlist_entries?.shows
          return !isRecordingSessionEmbedShow(show)
        })

        const [processedPerformances, processedSongData, processedSongShowMap] =
          await Promise.all([
            processPerformances(visibleEntries),
            processSongData(visibleEntries, client),
            processSongShowMap(visibleEntries),
          ])

        setPerformances(processedPerformances)
        setSongs(processedSongData.songs)
        setSongShowMap(processedSongShowMap)
        setSongSpreadData(processedSongData.songSpreadData)
        setProgress(100)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load guest data")
        setGuest(null)
        setPerformances([])
        setSongs([])
        setSongShowMap({})
        setSongSpreadData([])
      } finally {
        setLoading(false)
      }
    }

    fetchAllGuestData()
  }, [guestId])

  return {
    guest,
    performances,
    loading,
    progress,
    error,
    songShowMap,
    songs,
    songSpreadData,
  }
}

function processPerformances(
  allEntries: Array<{
    setlist_entries?: {
      shows?: {
        show_id: string
        show_date: string
        show_group: string
        show_subvenue: string
        show_venue_location: string
        show_tour: string | null
        subvenues?: { venues?: { venue_id?: string } } | null
      }
    }
  }>,
): GuestShow[] {
  const uniqueShowsMap: Record<string, GuestShow> = {}

  for (const item of allEntries) {
    const entry = item.setlist_entries
    const show = entry?.shows
    if (!show || isRecordingSessionEmbedShow(show as { show_detail?: string | null })) continue

    const subvenuesVal = show.subvenues
    const venueId =
      (Array.isArray(subvenuesVal)
        ? subvenuesVal[0]?.venues?.venue_id
        : (subvenuesVal as { venues?: { venue_id?: string } } | undefined)
            ?.venues?.venue_id) ?? null

    uniqueShowsMap[show.show_id] = {
      show_id: show.show_id,
      show_date: show.show_date,
      show_group: show.show_group ?? "",
      show_subvenue: show.show_subvenue ?? "",
      show_venue_location: show.show_venue_location ?? "",
      show_tour: show.show_tour ?? null,
      tour_id: null,
      venue_id: venueId ?? null,
    }
  }

  const uniqueShows = Object.values(uniqueShowsMap)
  uniqueShows.sort((a, b) => a.show_date.localeCompare(b.show_date))
  return uniqueShows
}

async function processSongData(
  allEntries: Array<{
    setlist_entries?: {
      songs?: {
        song?: string
        song_displayname?: string | null
        song_category?: string
        song_originalartist?: string | null
        categories?: { category_canonid?: number }
      }
    }
  }>,
  client: NonNullable<typeof supabase>,
): Promise<{
  songs: SongCount[]
  songSpreadData: SongSpreadCategory[]
}> {
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
    const songsRel = item.setlist_entries?.songs
    if (!songsRel?.song) continue

    const songName = songsRel.song
    const songDisplayName = songsRel.song_displayname ?? null
    const category = songsRel.song_category ?? "Uncategorized"
    const categoryCanonId = songsRel.categories?.category_canonid
    const originalArtist = songsRel.song_originalartist ?? null

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

  const categories = [...new Set(Object.values(songData).map((d) => d.category))]
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

  const songsArray: SongCount[] = Object.entries(songData).map(
    ([song, data]) => ({
      song,
      song_displayname: data.songDisplayName ?? null,
      play_count: data.count,
      category: data.category,
      category_canonid:
        data.categoryCanonId ?? categoryCanonIds[data.category] ?? 9999,
      original_artist: data.originalArtist,
    }),
  )

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
      song_displayname: songItem.song_displayname ?? null,
      playCount: songItem.play_count,
      artist: artist ?? undefined,
    })
    categoryTotalPerformances[category] += songItem.play_count
  }

  const songSpreadData: SongSpreadCategory[] = Object.keys(
    categoryTotalPerformances,
  ).map((category) => ({
    category,
    count: categoryTotalPerformances[category],
    canonid: categoryCanonIds[category] ?? 9999,
    songs: (categorySongs[category] ?? []).sort(
      (a, b) => b.playCount - a.playCount,
    ),
  }))
  songSpreadData.sort((a, b) => a.canonid - b.canonid)

  return { songs: songsArray, songSpreadData }
}

function processSongShowMap(
  allEntries: Array<{
    setlist_entries?: { entry_song?: string; entry_show?: string; songs?: { song?: string } }
  }>,
): Record<string, string[]> {
  const songShowMapping: Record<string, string[]> = {}

  for (const item of allEntries) {
    const entry = item.setlist_entries
    const songName = entry?.songs?.song ?? entry?.entry_song
    const showId = entry?.entry_show
    if (!songName || !showId) continue

    if (!songShowMapping[songName]) songShowMapping[songName] = []
    if (!songShowMapping[songName].includes(showId)) {
      songShowMapping[songName].push(showId)
    }
  }
  return songShowMapping
}
