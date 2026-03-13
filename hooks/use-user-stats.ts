"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { timeToSeconds } from "@/lib/stats/tour-utils"
import type {
  TopSong,
  LongestPerformance,
  SlotSong,
  NotSeenSong,
} from "@/types/user-stats"
import { SKIP_SHORTS } from "@/lib/utils/user-stats-utils"

const PAGE_SIZE = 1000
const CHUNK_SIZE = 200

export function useUserStats(effectiveUserId: string | null) {
  const [loading, setLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)

  const [topSongs, setTopSongs] = useState<TopSong[]>([])
  const [longestPerformances, setLongestPerformances] = useState<
    LongestPerformance[]
  >([])
  const [showOpeners, setShowOpeners] = useState<SlotSong[]>([])
  const [setOpeners, setSetOpeners] = useState<SlotSong[]>([])
  const [setClosers, setSetClosers] = useState<SlotSong[]>([])
  const [encoreSongs, setEncoreSongs] = useState<SlotSong[]>([])
  const [notSeenSongs, setNotSeenSongs] = useState<NotSeenSong[]>([])

  const [loadingTop, setLoadingTop] = useState(true)
  const [loadingLongest, setLoadingLongest] = useState(true)
  const [loadingShowOpeners, setLoadingShowOpeners] = useState(true)
  const [loadingSetOpeners, setLoadingSetOpeners] = useState(true)
  const [loadingSetClosers, setLoadingSetClosers] = useState(true)
  const [loadingEncores, setLoadingEncores] = useState(true)
  const [loadingNotSeen, setLoadingNotSeen] = useState(true)

  const skipShort = (entryShort: string | null | undefined): boolean => {
    if (!entryShort) return true
    return !SKIP_SHORTS.includes(entryShort.toLowerCase().trim())
  }

  const formatShowDate = (showDate: string): string => {
    const parts = showDate.split("-")
    if (parts.length < 3) return showDate
    const yearShort = parts[0].length >= 4 ? parts[0].slice(2, 4) : ""
    return [...parts.slice(1), yearShort].join(".")
  }

  const fetchTopSongs = async (
    showIdChunks: string[][],
    startProgress: number,
    endProgress: number
  ) => {
    const client = supabase
    if (!client) {
      setLoadingTop(false)
      return
    }
    try {
      const allEntries: Record<string, unknown>[] = []
      for (let i = 0; i < showIdChunks.length; i++) {
        const currentChunk = showIdChunks[i]
        let page = 0
        let hasMore = true
        while (hasMore) {
          const { data, error } = await client
            .from("setlist_entries")
            .select(
              `
              entry_song,
              entry_short,
              songs!inner(
                song_id,
                song_category,
                categories!inner(
                  category_canonid,
                  category_artwork
                )
              ),
              entry_show
            `
            )
            .in("entry_show", currentChunk)
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

          if (error) throw error
          if (data && data.length > 0) {
            allEntries.push(...data)
            page++
            const progressPerChunk = (endProgress - startProgress) / showIdChunks.length
            const chunkProgress = i * progressPerChunk
            const pageProgress =
              (page * progressPerChunk) / Math.ceil(currentChunk.length / PAGE_SIZE)
            setLoadingProgress(
              Math.min(endProgress, startProgress + chunkProgress + pageProgress)
            )
            hasMore = data.length === PAGE_SIZE
          } else {
            hasMore = false
          }
        }
      }

      const showSongGroups = new Map<string, Record<string, unknown>[]>()
      allEntries.forEach((entry) => {
        const showId = entry.entry_show as string
        if (!showSongGroups.has(showId)) showSongGroups.set(showId, [])
        showSongGroups.get(showId)!.push(entry)
      })

      const songShowCounts = new Map<
        string,
        {
          song: string
          song_id: string
          shows: Set<string>
          category_canonid?: number
          category_artwork?: string
        }
      >()

      showSongGroups.forEach((showEntries, showId) => {
        const validSongs = new Set<string>()
        showEntries.forEach((entry) => {
          if (skipShort(entry.entry_short as string | null))
            validSongs.add(entry.entry_song as string)
        })
        const countedSongsInShow = new Set<string>()
        showEntries.forEach((entry) => {
          if (
            validSongs.has(entry.entry_song as string) &&
            !countedSongsInShow.has(entry.entry_song as string)
          ) {
            countedSongsInShow.add(entry.entry_song as string)
            const songs = entry.songs as {
              song_id: string
              categories?: { category_canonid?: number; category_artwork?: string }
            }
            const songId = songs?.song_id
            if (!songId) return
            if (!songShowCounts.has(songId)) {
              songShowCounts.set(songId, {
                song: entry.entry_song as string,
                song_id: songId,
                shows: new Set([showId]),
                category_canonid: songs?.categories?.category_canonid,
                category_artwork: songs?.categories?.category_artwork,
              })
            } else {
              songShowCounts.get(songId)!.shows.add(showId)
            }
          }
        })
      })

      const processed = Array.from(songShowCounts.values())
        .map((item) => ({
          song: item.song,
          song_id: item.song_id,
          play_count: item.shows.size,
          category_canonid: item.category_canonid,
          category_artwork: item.category_artwork,
        }))
        .sort((a, b) => {
          if (b.play_count !== a.play_count) return b.play_count - a.play_count
          if ((a.category_canonid ?? 0) !== (b.category_canonid ?? 0))
            return (a.category_canonid ?? 0) - (b.category_canonid ?? 0)
          return a.song.localeCompare(b.song)
        })
        .slice(0, 8)

      setTopSongs(processed)
    } catch (err) {
      console.error("Error fetching top songs:", err)
    } finally {
      setLoadingTop(false)
    }
  }

  const fetchLongestPerformances = async (
    showIdChunks: string[][],
    startProgress: number,
    endProgress: number
  ) => {
    const client = supabase
    if (!client) {
      setLoadingLongest(false)
      return
    }
    try {
      const allEntries: Record<string, unknown>[] = []
      for (let i = 0; i < showIdChunks.length; i++) {
        const currentChunk = showIdChunks[i]
        let page = 0
        let hasMore = true
        while (hasMore) {
          const { data, error } = await client
            .from("setlist_entries")
            .select(
              `
              entry_song,
              entry_short,
              songs!inner(
                song_id,
                song_category,
                categories!inner(
                  category_canonid,
                  category_artwork
                )
              ),
              entry_length,
              entry_show,
              shows!inner(
                show_date,
                show_venue_location
              )
            `
            )
            .in("entry_show", currentChunk)
            .not("entry_length", "is", null)
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

          if (error) throw error
          if (data && data.length > 0) {
            allEntries.push(...data)
            page++
            const progressPerChunk =
              (endProgress - startProgress) / showIdChunks.length
            const chunkProgress = i * progressPerChunk
            const pageProgress =
              (page * progressPerChunk) /
              Math.ceil(currentChunk.length / PAGE_SIZE)
            setLoadingProgress(
              Math.min(
                endProgress,
                startProgress + chunkProgress + pageProgress
              )
            )
            hasMore = data.length === PAGE_SIZE
          } else {
            hasMore = false
          }
        }
      }

      const processed = allEntries
        .filter(
          (entry) =>
            skipShort(entry.entry_short as string | null)
        )
        .map((entry) => {
          const lengthSeconds = timeToSeconds(entry.entry_length as string)
          const shows = entry.shows as { show_date?: string; show_venue_location?: string }
          const songs = entry.songs as {
            song_id: string
            categories?: { category_artwork?: string }
          }
          return {
            song: entry.entry_song as string,
            song_id: songs?.song_id ?? "",
            show_date: formatShowDate(shows?.show_date ?? ""),
            show_id: entry.entry_show as string,
            venue_location: shows?.show_venue_location,
            length: entry.entry_length as string,
            length_seconds: lengthSeconds,
            category_artwork: songs?.categories?.category_artwork,
          }
        })
        .sort((a, b) => b.length_seconds - a.length_seconds)
        .slice(0, 8)

      setLongestPerformances(processed)
    } catch (err) {
      console.error("Error fetching longest performances:", err)
    } finally {
      setLoadingLongest(false)
    }
  }

  const fetchSlotSongs = async (
    showIdChunks: string[][],
    startProgress: number,
    endProgress: number,
    placementValues: string[],
    setter: (data: SlotSong[]) => void,
    setLoading: (loading: boolean) => void
  ) => {
    const client = supabase
    if (!client) {
      setLoading(false)
      return
    }
    try {
      const allEntries: Record<string, unknown>[] = []
      for (let i = 0; i < showIdChunks.length; i++) {
        const currentChunk = showIdChunks[i]
        let page = 0
        let hasMore = true
        while (hasMore) {
          const { data, error } = await client
            .from("setlist_entries")
            .select(
              `
              entry_song,
              songs!inner(
                song_id,
                song_category,
                categories!inner(
                  category_canonid,
                  category_artwork
                )
              ),
              entry_show
            `
            )
            .in("entry_show", currentChunk)
            .in("entry_placement", placementValues)
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

          if (error) throw error
          if (data && data.length > 0) {
            allEntries.push(...data)
            page++
            const progressPerChunk =
              (endProgress - startProgress) / showIdChunks.length
            const chunkProgress = i * progressPerChunk
            const pageProgress =
              (page * progressPerChunk) /
              Math.ceil(currentChunk.length / PAGE_SIZE)
            setLoadingProgress(
              Math.min(
                endProgress,
                startProgress + chunkProgress + pageProgress
              )
            )
            hasMore = data.length === PAGE_SIZE
          } else {
            hasMore = false
          }
        }
      }

      const songCounts = allEntries.reduce(
        (acc: Record<string, SlotSong>, entry) => {
          const songs = entry.songs as {
            song_id: string
            categories?: { category_canonid?: number; category_artwork?: string }
          }
          const songName = entry.entry_song as string
          if (!acc[songName]) {
            acc[songName] = {
              song_name: songName,
              song_id: songs?.song_id ?? "",
              times_played: 1,
              category_canonid: songs?.categories?.category_canonid,
              category_artwork: songs?.categories?.category_artwork,
            }
          } else {
            acc[songName].times_played++
          }
          return acc
        },
        {}
      )

      const processed = Object.values(songCounts)
        .sort((a, b) => {
          if (b.times_played !== a.times_played)
            return b.times_played - a.times_played
          if ((a.category_canonid ?? 0) !== (b.category_canonid ?? 0))
            return (a.category_canonid ?? 0) - (b.category_canonid ?? 0)
          return a.song_name.localeCompare(b.song_name)
        })
        .slice(0, 8)

      setter(processed)
    } catch (err) {
      console.error("Error fetching slot songs:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchNotSeenSongs = async (
    userShowIds: string[],
    startProgress: number,
    endProgress: number
  ) => {
    const client = supabase
    if (!client) {
      setLoadingNotSeen(false)
      setLoadingProgress(endProgress)
      return
    }
    try {
      setLoadingProgress(startProgress)

      const userSeenSongsMap = new Map<string, Record<string, unknown>[]>()
      const showIdChunks: string[][] = []
      for (let i = 0; i < userShowIds.length; i += CHUNK_SIZE) {
        showIdChunks.push(userShowIds.slice(i, i + CHUNK_SIZE))
      }

      for (let i = 0; i < showIdChunks.length; i++) {
        const currentChunk = showIdChunks[i]
        let page = 0
        let hasMore = true
        while (hasMore) {
          const { data, error } = await client
            .from("setlist_entries")
            .select(
              `
              entry_song,
              entry_short,
              songs!inner(song_id),
              entry_show
            `
            )
            .in("entry_show", currentChunk)
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

          if (error) throw error
          if (data && data.length > 0) {
            data.forEach((entry) => {
              const showId = entry.entry_show as string
              if (!userSeenSongsMap.has(showId)) userSeenSongsMap.set(showId, [])
              userSeenSongsMap.get(showId)!.push(entry)
            })
            page++
            const progressPerChunk = 10 / showIdChunks.length
            const chunkProgress = i * progressPerChunk
            const pageProgress =
              (page * progressPerChunk) /
              Math.ceil(currentChunk.length / PAGE_SIZE)
            setLoadingProgress(
              Math.min(
                startProgress + 10,
                startProgress + chunkProgress + pageProgress
              )
            )
            hasMore = data.length === PAGE_SIZE
          } else {
            hasMore = false
          }
        }
      }

      const userSeenSongs = new Set<string>()
      userSeenSongsMap.forEach((showEntries) => {
        const validSongs = new Set<string>()
        showEntries.forEach((entry) => {
          if (skipShort(entry.entry_short as string | null))
            validSongs.add(entry.entry_song as string)
        })
        showEntries.forEach((entry) => {
          if (validSongs.has(entry.entry_song as string)) {
            const songs = entry.songs as { song_id: string }
            userSeenSongs.add(songs?.song_id ?? "")
          }
        })
      })

      setLoadingProgress(startProgress + 10)

      const allEntriesMap = new Map<string, Record<string, unknown>[]>()
      let page = 0
      let hasMore = true

      while (hasMore) {
        const { data, error } = await client
          .from("setlist_entries")
          .select(
            `
            entry_song,
            entry_short,
            songs!inner(
              song_id,
              song_category,
              categories!inner(
                category_canonid,
                category_artwork
              )
            ),
            entry_show,
            shows!inner(
              show_canonid
            )
          `
          )
          .not("shows.show_canonid", "is", null)
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

        if (error) throw error
        if (data && data.length > 0) {
          data.forEach((entry) => {
            const showId = entry.entry_show as string
            if (!allEntriesMap.has(showId)) allEntriesMap.set(showId, [])
            allEntriesMap.get(showId)!.push(entry)
          })
          page++
          const allocatedProgress = endProgress - startProgress - 15
          const progressPerPage =
            allocatedProgress /
            Math.max(5, Math.ceil(data.length / PAGE_SIZE) * 2)
          setLoadingProgress(
            Math.min(
              endProgress - 5,
              startProgress + 10 + page * progressPerPage
            )
          )
          hasMore = data.length === PAGE_SIZE
        } else {
          hasMore = false
        }
      }

      const allSongCounts: Record<
        string,
        {
          song: string
          song_id: string
          shows: Set<string>
          category_canonid?: number
          category_artwork?: string
        }
      > = {}

      allEntriesMap.forEach((showEntries) => {
        const validSongs = new Set<string>()
        showEntries.forEach((entry) => {
          if (skipShort(entry.entry_short as string | null))
            validSongs.add(entry.entry_song as string)
        })
        const countedSongsInShow = new Set<string>()
        showEntries.forEach((entry) => {
          const songs = entry.songs as {
            song_id: string
            categories?: { category_canonid?: number; category_artwork?: string }
          }
          const songId = songs?.song_id
          const songName = entry.entry_song as string
          if (
            songId &&
            validSongs.has(songName) &&
            !countedSongsInShow.has(songId)
          ) {
            countedSongsInShow.add(songId)
            if (!allSongCounts[songId]) {
              allSongCounts[songId] = {
                song: songName,
                song_id: songId,
                shows: new Set([entry.entry_show as string]),
                category_canonid: songs?.categories?.category_canonid,
                category_artwork: songs?.categories?.category_artwork,
              }
            } else {
              allSongCounts[songId].shows.add(entry.entry_show as string)
            }
          }
        })
      })

      const notSeen = Object.values(allSongCounts)
        .filter((item) => !userSeenSongs.has(item.song_id))
        .map((item) => ({
          song: item.song,
          song_id: item.song_id,
          play_count: item.shows.size,
          category_canonid: item.category_canonid,
          category_artwork: item.category_artwork,
        }))
        .sort((a, b) => {
          if (b.play_count !== a.play_count) return b.play_count - a.play_count
          if ((a.category_canonid ?? 0) !== (b.category_canonid ?? 0))
            return (a.category_canonid ?? 0) - (b.category_canonid ?? 0)
          return a.song.localeCompare(b.song)
        })
        .slice(0, 8)

      setNotSeenSongs(notSeen)
    } catch (err) {
      console.error("Error fetching not seen songs:", err)
    } finally {
      setLoadingNotSeen(false)
      setLoadingProgress(endProgress)
    }
  }

  useEffect(() => {
    if (!effectiveUserId) return

    async function fetchUserShowIds() {
      const client = supabase
      if (!client) {
        setLoading(false)
        return
      }
      try {
        setLoadingProgress(5)

        const allAttendedShows: { show_id: string }[] = []
        let page = 0
        let hasMore = true

        while (hasMore) {
          const { data, error } = await client
            .from("user_attended_shows")
            .select("show_id")
            .eq("user_id", effectiveUserId)
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

          if (error) throw error
          if (data && data.length > 0) {
            allAttendedShows.push(...data)
            page++
            setLoadingProgress(Math.min(15, 5 + page * 2))
            hasMore = data.length === PAGE_SIZE
          } else {
            hasMore = false
          }
        }

        if (allAttendedShows.length === 0) {
          setTopSongs([])
          setLongestPerformances([])
          setShowOpeners([])
          setSetOpeners([])
          setSetClosers([])
          setEncoreSongs([])
          setNotSeenSongs([])
          setLoadingTop(false)
          setLoadingLongest(false)
          setLoadingShowOpeners(false)
          setLoadingSetOpeners(false)
          setLoadingSetClosers(false)
          setLoadingEncores(false)
          setLoadingNotSeen(false)
          setLoadingProgress(100)
          setTimeout(() => setLoading(false), 500)
          return
        }

        const showIds = allAttendedShows.map((s) => s.show_id)
        const showIdChunks: string[][] = []
        for (let i = 0; i < showIds.length; i += CHUNK_SIZE) {
          showIdChunks.push(showIds.slice(i, i + CHUNK_SIZE))
        }

        setLoadingProgress(20)

        await Promise.all([
          fetchTopSongs(showIdChunks, 20, 30),
          fetchLongestPerformances(showIdChunks, 30, 40),
          fetchSlotSongs(
            showIdChunks,
            40,
            50,
            ["Set 1 Opener"],
            setShowOpeners,
            setLoadingShowOpeners
          ),
          fetchSlotSongs(
            showIdChunks,
            50,
            60,
            [
              "Set 1 Opener",
              "Set 2 Opener",
              "Set 3 Opener",
              "Set 4 Opener",
              "Set 5 Opener",
            ],
            setSetOpeners,
            setLoadingSetOpeners
          ),
          fetchSlotSongs(
            showIdChunks,
            60,
            70,
            [
              "Set 1 Closer",
              "Set 2 Closer",
              "Set 3 Closer",
              "Set 4 Closer",
              "Set 5 Closer",
            ],
            setSetClosers,
            setLoadingSetClosers
          ),
          fetchSlotSongs(
            showIdChunks,
            70,
            80,
            ["Encore", "Encore 1", "Encore 2", "Encore 3"],
            setEncoreSongs,
            setLoadingEncores
          ),
          fetchNotSeenSongs(showIds, 80, 100),
        ])

        setLoadingProgress(100)
        setTimeout(() => setLoading(false), 500)
      } catch (err) {
        console.error("Error fetching user show data:", err)
        setLoadingProgress(100)
        setTimeout(() => setLoading(false), 500)
      }
    }

    fetchUserShowIds()
  }, [effectiveUserId])

  return {
    loading,
    loadingProgress,
    topSongs,
    longestPerformances,
    showOpeners,
    setOpeners,
    setClosers,
    encoreSongs,
    notSeenSongs,
    loadingTop,
    loadingLongest,
    loadingShowOpeners,
    loadingSetOpeners,
    loadingSetClosers,
    loadingEncores,
    loadingNotSeen,
  }
}
