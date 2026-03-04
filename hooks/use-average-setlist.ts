import { useEffect, useMemo, useRef, useState } from "react"

import { supabase } from "@/lib/supabase"

interface ShowSlice {
  show_id: string
  show_iscanon: boolean
  show_canonid: number | null
}

interface SetlistEntry {
  entry_song: string
  entry_short: string | null
  entry_segue: string | null
  entry_placement: string
  entry_setorder: number
  entry_set: string
  entry_setnum: number
  averageLength: string | null
  songs: {
    song_id: string
    category_artwork?: string | null
  }
}

interface SongSelectionDetail {
  song: string
  assignedSet: string
  totalAppearances: number
  averagePoints: number
  rarityPercentage: number
}

interface SetlistStats {
  totalCanonicalShows: number
  totalSetlistEntries: number
  includedSets: Array<{
    set: string
    showsWithSet: number
    percentage: number
    avgSongsPerSet: number
  }>
  totalUniqueSongs: number
  threshold: number
  songSelections: SongSelectionDetail[]
}

export interface AverageSetlistResult {
  averageSetlist: SetlistEntry[]
  stats: SetlistStats | null
  isLoading: boolean
  error: string | null
}

const SET_ORDER = ["1", "2", "3", "4", "5", "E1", "E2", "E3"]
const SKIP_SHORTS = ["fake", "tease", "reprise", "aborted"]
const SET_INCLUSION_THRESHOLD = 0.5
const PAGE_SIZE = 1000
const CHUNK_SIZE = 200

const SET_POINTS: Record<string, number> = {
  "1": 100,
  "2": 200,
  "3": 300,
  "4": 400,
  "5": 500,
  E1: 600,
  E2: 700,
  E3: 800,
}

export function useAverageSetlist(
  shows: ShowSlice[],
  _type: "year" | "tour",
): AverageSetlistResult {
  const [averageSetlist, setAverageSetlist] = useState<SetlistEntry[]>([])
  const [stats, setStats] = useState<SetlistStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const showsRef = useRef(shows)
  showsRef.current = shows

  const showsKey = useMemo(() => {
    if (!shows || shows.length === 0) {
      return ""
    }
    const canonicalShowIds = shows
      .filter((show) => show.show_iscanon === true || show.show_canonid !== null)
      .map((show) => show.show_id)
      .sort()
    return canonicalShowIds.join("|")
  }, [shows])

  useEffect(() => {
    async function calculateAverageSetlist() {
      const currentShows = showsRef.current

      if (!currentShows || currentShows.length === 0 || !supabase) {
        setAverageSetlist([])
        setStats(null)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const canonicalShows = currentShows.filter(
          (show) => show.show_iscanon === true || show.show_canonid !== null,
        )

        if (canonicalShows.length === 0) {
          setAverageSetlist([])
          setStats(null)
          setIsLoading(false)
          return
        }

        const showIds = canonicalShows.map((show) => show.show_id)
        const canonIds = canonicalShows
          .map((s) => s.show_canonid)
          .filter((id): id is number => id !== null)
        const maxCanonId = Math.max(...canonIds)
        const minCanonId = 1
        const canonRange = maxCanonId - minCanonId + 1

        const showIdChunks: string[][] = []
        for (let i = 0; i < showIds.length; i += CHUNK_SIZE) {
          showIdChunks.push(showIds.slice(i, i + CHUNK_SIZE))
        }

        const client = supabase
        let allEntries: any[] = []

        for (const chunk of showIdChunks) {
          let page = 0
          let hasMore = true

          while (hasMore) {
            const { data, error: entriesError } = await client
              .from("setlist_entries")
              .select(
                `
                entry_song,
                entry_short,
                entry_segue,
                entry_placement,
                entry_set,
                entry_setnum,
                entry_show,
                entry_length,
                songs (
                  song_id,
                  categories (
                    category_artwork
                  )
                )
              `,
              )
              .in("entry_show", chunk)
              .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

            if (entriesError) throw entriesError

            if (data && data.length > 0) {
              allEntries = allEntries.concat(data as any[])
              page += 1
              hasMore = data.length === PAGE_SIZE
            } else {
              hasMore = false
            }
          }
        }

        const validEntries = allEntries.filter(
          (entry) =>
            !entry.entry_short ||
            !SKIP_SHORTS.includes(entry.entry_short.toLowerCase()),
        )

        if (validEntries.length === 0) {
          setAverageSetlist([])
          setStats({
            totalCanonicalShows: canonicalShows.length,
            totalSetlistEntries: 0,
            includedSets: [],
            totalUniqueSongs: 0,
            threshold: SET_INCLUSION_THRESHOLD * 100,
            songSelections: [],
          })
          setIsLoading(false)
          return
        }

        const setShowCounts = new Map<string, Set<string>>()
        const setSongCounts = new Map<string, Map<string, Set<string>>>()

        validEntries.forEach((entry) => {
          const set = entry.entry_set as string
          const showId = entry.entry_show as string
          const song = entry.entry_song as string

          if (!setShowCounts.has(set)) {
            setShowCounts.set(set, new Set())
            setSongCounts.set(set, new Map())
          }

          setShowCounts.get(set)!.add(showId)

          if (!setSongCounts.get(set)!.has(song)) {
            setSongCounts.get(set)!.set(song, new Set())
          }
          setSongCounts.get(set)!.get(song)!.add(showId)
        })

        const includedSets: string[] = []
        const includedSetsStats: SetlistStats["includedSets"] = []

        SET_ORDER.forEach((set) => {
          const showsWithSet = setShowCounts.get(set)
          if (showsWithSet) {
            const percentage = showsWithSet.size / canonicalShows.length
            if (percentage > SET_INCLUSION_THRESHOLD) {
              includedSets.push(set)

              const showsWithSetArray = Array.from(showsWithSet)
              let totalSongs = 0

              showsWithSetArray.forEach((showId) => {
                const uniqueSongsInShow = new Set<string>()
                validEntries.forEach((entry) => {
                  if (
                    entry.entry_show === showId &&
                    entry.entry_set === set
                  ) {
                    uniqueSongsInShow.add(entry.entry_song)
                  }
                })
                totalSongs += uniqueSongsInShow.size
              })

              const avgSongsPerSet = Math.round(
                totalSongs / showsWithSetArray.length,
              )

              includedSetsStats.push({
                set,
                showsWithSet: showsWithSet.size,
                percentage: percentage * 100,
                avgSongsPerSet,
              })
            }
          }
        })

        if (includedSets.length === 0) {
          setAverageSetlist([])
          setStats({
            totalCanonicalShows: canonicalShows.length,
            totalSetlistEntries: validEntries.length,
            includedSets: [],
            totalUniqueSongs: 0,
            threshold: SET_INCLUSION_THRESHOLD * 100,
            songSelections: [],
          })
          setIsLoading(false)
          return
        }

        const totalSongsNeeded = includedSetsStats.reduce(
          (sum, setInfo) => sum + setInfo.avgSongsPerSet,
          0,
        )

        const songFrequency = new Map<string, number>()
        const songShowIds = new Map<string, Set<string>>()
        const allUniqueSongs = new Set<string>()

        validEntries.forEach((entry) => {
          const song = entry.entry_song as string
          const showId = entry.entry_show as string

          allUniqueSongs.add(song)

          if (!songShowIds.has(song)) {
            songShowIds.set(song, new Set())
            songFrequency.set(song, 0)
          }

          if (!songShowIds.get(song)!.has(showId)) {
            songShowIds.get(song)!.add(showId)
            songFrequency.set(song, (songFrequency.get(song) ?? 0) + 1)
          }
        })

        const songRarity = new Map<string, number>()

        const { data: allCanonicalShowsUpToMax, error: canonShowsError } =
          await client
            .from("shows")
            .select("show_id, show_canonid")
            .not("show_canonid", "is", null)
            .lte("show_canonid", maxCanonId)
            .order("show_canonid", { ascending: true })

        if (canonShowsError) {
          // eslint-disable-next-line no-console
          console.error(
            "Error fetching canonical shows for rarity:",
            canonShowsError,
          )
        }

        const allCanonicalShowIds = new Set(
          (allCanonicalShowsUpToMax ?? []).map((s: any) => s.show_id as string),
        )

        const showIdToCanonId = new Map<string, number>()
        ;(allCanonicalShowsUpToMax ?? []).forEach((s: any) => {
          if (s.show_canonid != null) {
            showIdToCanonId.set(s.show_id as string, s.show_canonid as number)
          }
        })

        if (allCanonicalShowIds.size > 0) {
          const allCanonicalShowIdsArray = Array.from(allCanonicalShowIds)
          const canonShowIdChunks: string[][] = []
          for (let i = 0; i < allCanonicalShowIdsArray.length; i += CHUNK_SIZE) {
            canonShowIdChunks.push(
              allCanonicalShowIdsArray.slice(i, i + CHUNK_SIZE),
            )
          }

          let allCanonEntries: any[] = []

          for (const chunk of canonShowIdChunks) {
            let page = 0
            let hasMore = true

            while (hasMore) {
              const { data, error: entriesError } = await client
                .from("setlist_entries")
                .select("entry_song, entry_show, entry_short")
                .in("entry_show", chunk)
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

              if (entriesError) {
                // eslint-disable-next-line no-console
                console.error(
                  "Error fetching canonical entries for rarity:",
                  entriesError,
                )
                hasMore = false
                break
              }

              if (data && data.length > 0) {
                allCanonEntries = allCanonEntries.concat(data as any[])
                page += 1
                hasMore = data.length === PAGE_SIZE
              } else {
                hasMore = false
              }
            }
          }

          const validCanonEntries = allCanonEntries.filter(
            (entry) =>
              !entry.entry_short ||
              !SKIP_SHORTS.includes(entry.entry_short.toLowerCase()),
          )

          const songDebutCanonIds = new Map<string, number>()
          const songCanonShowCounts = new Map<string, Set<string>>()

          validCanonEntries.forEach((entry: any) => {
            const song = entry.entry_song as string
            const showId = entry.entry_show as string
            const canonId = showIdToCanonId.get(showId)
            if (canonId == null) return

            if (
              !songDebutCanonIds.has(song) ||
              canonId < (songDebutCanonIds.get(song) ?? canonId)
            ) {
              songDebutCanonIds.set(song, canonId)
            }

            if (!songCanonShowCounts.has(song)) {
              songCanonShowCounts.set(song, new Set())
            }
            songCanonShowCounts.get(song)!.add(showId)
          })

          songShowIds.forEach((_showIdSet, song) => {
            const debutCanonId = songDebutCanonIds.get(song)
            const canonShowCount = songCanonShowCounts.get(song)?.size ?? 0

            if (debutCanonId !== undefined) {
              const showRange = maxCanonId - debutCanonId + 1
              const rarityPercentage = (canonShowCount / showRange) * 100
              songRarity.set(song, rarityPercentage)
            } else {
              songRarity.set(song, 0)
            }
          })
        } else {
          songShowIds.forEach((showIdSet, song) => {
            const uniqueShowCount = showIdSet.size
            const rarityPercentage = (uniqueShowCount / canonRange) * 100
            songRarity.set(song, rarityPercentage)
          })
        }

        const sortedSongs = Array.from(songFrequency.entries())
          .map(([song, count]) => ({
            song,
            count,
            rarity: songRarity.get(song) ?? 0,
          }))
          .sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count
            return b.rarity - a.rarity
          })
          .slice(0, totalSongsNeeded)

        const parseDuration = (interval: string | null | undefined): number | null => {
          if (!interval) return null
          const match = interval.match(/^(?:(\d+):)?(\d+):(\d+)$/)
          if (match) {
            const hours = parseInt(match[1] || "0", 10)
            const minutes = parseInt(match[2], 10)
            const seconds = parseInt(match[3], 10)
            return hours * 3600 + minutes * 60 + seconds
          }
          return null
        }

        const formatDuration = (seconds: number): string => {
          const hours = Math.floor(seconds / 3600)
          const minutes = Math.floor((seconds % 3600) / 60)
          const secs = seconds % 60
          if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
              .toString()
              .padStart(2, "0")}`
          }
          return `${minutes}:${secs.toString().padStart(2, "0")}`
        }

        interface SongPointData {
          song: string
          averagePoints: number
          averageLength: string | null
          totalAppearances: number
          rarityPercentage: number
        }

        const songPointData: SongPointData[] = []

        sortedSongs.forEach(({ song, count, rarity }) => {
          const songEntries = validEntries.filter(
            (e) => e.entry_song === song,
          )

          const showPoints = new Map<string, number[]>()
          const showLengths = new Map<string, number>()

          songEntries.forEach((entry: any) => {
            const showId = entry.entry_show as string
            const set = entry.entry_set as string
            const setnum = entry.entry_setnum as number

            const basePoints = SET_POINTS[set] ?? 0
            const points =
              set === "1" && setnum === 1 ? 1 : basePoints + setnum

            if (!showPoints.has(showId)) {
              showPoints.set(showId, [])
              showLengths.set(showId, 0)
            }
            showPoints.get(showId)!.push(points)

            const lengthSeconds = parseDuration(entry.entry_length)
            if (lengthSeconds !== null) {
              showLengths.set(
                showId,
                (showLengths.get(showId) ?? 0) + lengthSeconds,
              )
            }
          })

          const showAverages: number[] = []
          showPoints.forEach((pointsArray) => {
            const showAverage =
              pointsArray.reduce((sum, p) => sum + p, 0) / pointsArray.length
            showAverages.push(showAverage)
          })

          const overallAverage =
            showAverages.reduce((sum, avg) => sum + avg, 0) /
            showAverages.length

          const showLengthValues = Array.from(showLengths.values()).filter(
            (v) => v > 0,
          )
          let averageLength: string | null = null
          if (showLengthValues.length > 0) {
            const totalSeconds = showLengthValues.reduce(
              (sum, sec) => sum + sec,
              0,
            )
            const avgSeconds = totalSeconds / showLengthValues.length
            averageLength = formatDuration(Math.round(avgSeconds))
          }

          songPointData.push({
            song,
            averagePoints: overallAverage,
            averageLength,
            totalAppearances: count,
            rarityPercentage: rarity,
          })
        })

        songPointData.sort((a, b) => a.averagePoints - b.averagePoints)

        const resultEntries: SetlistEntry[] = []
        const songSelections: SongSelectionDetail[] = []

        let currentIndex = 0
        includedSets.forEach((set) => {
          const setStat = includedSetsStats.find((s) => s.set === set)
          const numSongs = setStat?.avgSongsPerSet ?? 0

          let placement = ""
          if (set === "1") placement = "Set 1"
          else if (set === "2") placement = "Set 2"
          else if (set === "3") placement = "Set 3"
          else if (set === "4") placement = "Set 4"
          else if (set === "5") placement = "Set 5"
          else if (set === "E1") placement = "Encore 1"
          else if (set === "E2") placement = "Encore 2"
          else if (set === "E3") placement = "Encore 3"

          const songsForSet = songPointData.slice(currentIndex, currentIndex + numSongs)

          songsForSet.forEach((songData, index) => {
            const sampleEntry = validEntries.find(
              (e) => e.entry_song === songData.song && e.songs?.song_id,
            )

            if (!sampleEntry) return

            const positionInSet = index + 1
            let finalPlacement = placement
            if (!set.startsWith("E")) {
              if (index === 0) finalPlacement = `${placement} Opener`
              else if (index === songsForSet.length - 1)
                finalPlacement = `${placement} Closer`
            }

            resultEntries.push({
              entry_song: songData.song,
              entry_short: null,
              entry_segue: null,
              entry_placement: finalPlacement,
              entry_setorder: positionInSet,
              entry_set: set,
              entry_setnum: positionInSet,
              averageLength: songData.averageLength,
              songs: {
                song_id: sampleEntry.songs?.song_id ?? "",
                category_artwork:
                  sampleEntry.songs?.categories?.category_artwork ?? null,
              },
            })

            songSelections.push({
              song: songData.song,
              assignedSet: set,
              totalAppearances: songData.totalAppearances,
              averagePoints: songData.averagePoints,
              rarityPercentage: songData.rarityPercentage,
            })
          })

          currentIndex += numSongs
        })

        resultEntries.sort((a, b) => {
          const setIndexA = SET_ORDER.indexOf(a.entry_set)
          const setIndexB = SET_ORDER.indexOf(b.entry_set)
          if (setIndexA !== setIndexB) {
            return setIndexA - setIndexB
          }
          return a.entry_setnum - b.entry_setnum
        })

        setAverageSetlist(resultEntries)
        setStats({
          totalCanonicalShows: canonicalShows.length,
          totalSetlistEntries: validEntries.length,
          includedSets: includedSetsStats,
          totalUniqueSongs: allUniqueSongs.size,
          threshold: SET_INCLUSION_THRESHOLD * 100,
          songSelections,
        })
        setIsLoading(false)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error calculating average setlist:", err)
        setError(
          err instanceof Error
            ? err.message
            : "Failed to calculate average setlist",
        )
        setAverageSetlist([])
        setStats(null)
        setIsLoading(false)
      }
    }

    calculateAverageSetlist()
  }, [showsKey])

  return {
    averageSetlist,
    stats,
    isLoading,
    error,
  }
}

