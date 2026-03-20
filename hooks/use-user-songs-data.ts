"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

const BATCH_SIZE = 1000
const CHUNK_SIZE = 200
const SKIP_SHORTS = ["fake", "tease", "reprise", "aborted"]

export interface UserSong {
  song: string
  song_id: string
  song_displayname?: string | null
  song_category: string
  song_categoryorder: number
  song_originalartist: string
}

export interface UserSongCategory {
  category: string
  category_canonid: number
  category_display_name: string
  category_color1: string
  category_color2: string
  category_artwork: string
  category_type?: string
}

export interface UserSongStat {
  song_id: string
  count: number
  last_seen_date?: string
}

export function useUserSongsData(userId: string | null) {
  const [categories, setCategories] = useState<UserSongCategory[]>([])
  const [songs, setSongs] = useState<UserSong[]>([])
  const [userSongStats, setUserSongStats] = useState<UserSongStat[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)

  useEffect(() => {
    async function fetchData() {
      if (!supabase) {
        setLoading(false)
        return
      }

      setLoading(true)
      setLoadingProgress(5)

      try {
        const { data: categoriesData, error: catError } = await supabase
          .from("categories")
          .select("*")
          .order("category_canonid", { ascending: true })

        if (catError) throw catError
        setLoadingProgress(15)

        const { count, error: countError } = await supabase
          .from("songs")
          .select("*", { count: "exact", head: true })
          .eq("song_placeholder", false)

        if (countError) throw countError

        const totalBatches = Math.ceil((count ?? 0) / BATCH_SIZE)
        let allSongsData: UserSong[] = []

        for (let i = 0; i < totalBatches; i++) {
          const start = i * BATCH_SIZE
          const end = Math.min(start + BATCH_SIZE - 1, (count ?? 0) - 1)

          const { data, error: batchError } = await supabase
            .from("songs")
            .select("*")
            .eq("song_placeholder", false)
            .order("song_categoryorder", { ascending: true })
            .range(start, end)

          if (batchError) throw batchError
          if (data) allSongsData = [...allSongsData, ...data]

          setLoadingProgress(
            Math.min(35, 15 + (i / totalBatches) * 20)
          )
        }

        setLoadingProgress(40)

        let songStats: UserSongStat[] = []

        if (userId) {
          let allAttendedShows: Array<{ show_id: string }> = []
          let page = 0
          let hasMore = true

          while (hasMore) {
            const { data, error } = await supabase
              .from("user_attended_shows")
              .select("show_id")
              .eq("user_id", userId)
              .range(page * BATCH_SIZE, (page + 1) * BATCH_SIZE - 1)

            if (error) throw error

            if (data && data.length > 0) {
              allAttendedShows = [...allAttendedShows, ...data]
              page++
              hasMore = data.length === BATCH_SIZE
            } else {
              hasMore = false
            }
          }

          setLoadingProgress(50)

          if (allAttendedShows.length > 0) {
            const showIds = allAttendedShows.map((s) => s.show_id)
            const showIdChunks: string[][] = []
            for (let i = 0; i < showIds.length; i += CHUNK_SIZE) {
              showIdChunks.push(showIds.slice(i, i + CHUNK_SIZE))
            }

            let allEntriesData: Array<{
              entry_song: string
              entry_show: string
              entry_short?: string | null
            }> = []

            for (let i = 0; i < showIdChunks.length; i++) {
              const chunk = showIdChunks[i]
              page = 0
              hasMore = true

              while (hasMore) {
                const { data, error } = await supabase
                  .from("setlist_entries")
                  .select("entry_song, entry_show, entry_short")
                  .in("entry_show", chunk)
                  .range(page * BATCH_SIZE, (page + 1) * BATCH_SIZE - 1)

                if (error) throw error

                if (data && data.length > 0) {
                  allEntriesData = [...allEntriesData, ...data]
                  page++
                  hasMore = data.length === BATCH_SIZE
                } else {
                  hasMore = false
                }
              }

              setLoadingProgress(
                Math.min(70, 50 + ((i + 1) / showIdChunks.length) * 20)
              )
            }

            const showEntriesMap = new Map<string, typeof allEntriesData>()
            allEntriesData.forEach((entry) => {
              if (!showEntriesMap.has(entry.entry_show)) {
                showEntriesMap.set(entry.entry_show, [])
              }
              showEntriesMap.get(entry.entry_show)!.push(entry)
            })

            const validEntries: typeof allEntriesData = []
            showEntriesMap.forEach((showEntries, showId) => {
              const validSongs = new Set<string>()
              showEntries.forEach((entry) => {
                if (
                  !entry.entry_short ||
                  !SKIP_SHORTS.includes(entry.entry_short.toLowerCase())
                ) {
                  validSongs.add(entry.entry_song)
                }
              })
              showEntries.forEach((entry) => {
                if (validSongs.has(entry.entry_song)) {
                  validEntries.push(entry)
                }
              })
            })

            let allShowsData: Array<{ show_id: string; show_date: string }> = []

            for (const chunk of showIdChunks) {
              page = 0
              hasMore = true

              while (hasMore) {
                const { data, error } = await supabase
                  .from("shows")
                  .select("show_id, show_date")
                  .in("show_id", chunk)
                  .range(page * BATCH_SIZE, (page + 1) * BATCH_SIZE - 1)

                if (error) throw error

                if (data && data.length > 0) {
                  allShowsData = [...allShowsData, ...data]
                  page++
                  hasMore = data.length === BATCH_SIZE
                } else {
                  hasMore = false
                }
              }
            }

            const showDates: Record<string, string> = {}
            allShowsData.forEach((s) => {
              showDates[s.show_id] = s.show_date
            })

            const songNames = [...new Set(validEntries.map((e) => e.entry_song))]
            const songNameToId: Record<string, string> = {}
            const songsData = allSongsData
            songNames.forEach((name) => {
              const song = songsData.find((s) => s.song === name)
              if (song) songNameToId[name] = song.song_id
            })

            const songCounts: Record<
              string,
              { count: number; dates: string[]; showsSet: Set<string> }
            > = {}

            validEntries.forEach((entry) => {
              const songId = songNameToId[entry.entry_song]
              if (songId) {
                if (!songCounts[songId]) {
                  songCounts[songId] = {
                    count: 0,
                    dates: [],
                    showsSet: new Set(),
                  }
                }
                if (!songCounts[songId].showsSet.has(entry.entry_show)) {
                  songCounts[songId].showsSet.add(entry.entry_show)
                  songCounts[songId].count += 1
                  const d = showDates[entry.entry_show]
                  if (d) songCounts[songId].dates.push(d)
                }
              }
            })

            songStats = Object.entries(songCounts).map(([song_id, data]) => {
              const sortedDates = [...data.dates].sort(
                (a, b) => new Date(b).getTime() - new Date(a).getTime()
              )
              return {
                song_id,
                count: data.count,
                last_seen_date: sortedDates[0],
              }
            })
          }
        }

        setLoadingProgress(95)
        setCategories((categoriesData as UserSongCategory[]) ?? [])
        setSongs(allSongsData)
        setUserSongStats(songStats)
        setLoadingProgress(100)
      } catch (err) {
        console.error("Error fetching user songs data:", err)
        setCategories([])
        setSongs([])
        setUserSongStats([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId])

  return { categories, songs, userSongStats, loading, loadingProgress }
}
