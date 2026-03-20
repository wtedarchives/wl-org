"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

const SKIP_SHORTS = ["fake", "tease", "reprise", "aborted"]
const COVER_CATEGORIES = ["Cover Songs", "Miscellaneous Covers"]

function formatShowDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z")
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${m}.${day}`
}

function setOrder(set: string): number {
  const s = String(set ?? "")
  if (s === "1") return 0
  if (s === "2") return 1
  if (s === "3") return 2
  if (s === "4") return 3
  if (s === "5") return 4
  if (s === "E1") return 5
  if (s === "E2") return 6
  if (s === "E3") return 7
  return 8
}

export type UserMatrixSortMode =
  | "alphabetical"
  | "chronological"
  | "playcount"

export interface UserSongMatrixData {
  songs: string[]
  songDisplayNameMap: Record<string, string | null>
  showDates: Array<{ id: string; date: string; displayDate: string }>
  data: Record<
    string,
    Array<{
      showId: string
      placement: string | null
      count: number
      venueAppearanceCount: number
    }>
  >
}

export interface UserSongSpreadCategory {
  category: string
  count: number
  canonid: number
  songs: string[]
}

export interface YearGroup {
  year: string
  yearId: string | null
  shows: Array<{ show_id: string; show_date: string }>
}

export function useUserSongMatrix(
  shows: Array<{ show_id: string; show_date: string }>,
  sortMode: UserMatrixSortMode = "alphabetical"
) {
  const [songMatrix, setSongMatrix] = useState<UserSongMatrixData>({
    songs: [],
    songDisplayNameMap: {},
    showDates: [],
    data: {},
  })
  const [sortedSongs, setSortedSongs] = useState<string[]>([])
  const [yearGroups, setYearGroups] = useState<YearGroup[]>([])
  const [yearIdMap, setYearIdMap] = useState<Record<string, string>>({})
  const [songSpreadData, setSongSpreadData] = useState<
    UserSongSpreadCategory[]
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!shows?.length || !supabase) {
      setIsLoading(false)
      return
    }

    async function buildMatrix() {
      if (!supabase) return
      try {
        setIsLoading(true)
        setErrorMessage(null)

        const showIds = shows.map((s) => s.show_id)
        const showDateMap = new Map(shows.map((s) => [s.show_id, s.show_date]))

        const uniqueYears = [
          ...new Set(shows.map((s) => s.show_date.slice(0, 4))),
        ]
        const { data: yearsData } = await supabase
          .from("years")
          .select("year, year_id")
          .in("year", uniqueYears)

        const yearIdMapLocal: Record<string, string> = {}
        ;(yearsData ?? []).forEach((r: { year: string; year_id: string }) => {
          yearIdMapLocal[r.year] = r.year_id
        })
        setYearIdMap(yearIdMapLocal)

        const sortedShows = [...shows].sort(
          (a, b) =>
            new Date(a.show_date).getTime() - new Date(b.show_date).getTime()
        )

        const groups: YearGroup[] = []
        let currentYear = ""
        let currentGroup: typeof sortedShows = []

        sortedShows.forEach((show) => {
          const year = show.show_date.slice(0, 4)
          if (year !== currentYear) {
            if (currentGroup.length > 0) {
              groups.push({
                year: currentYear,
                yearId: yearIdMapLocal[currentYear] ?? null,
                shows: currentGroup,
              })
            }
            currentYear = year
            currentGroup = [show]
          } else {
            currentGroup.push(show)
          }
        })
        if (currentGroup.length > 0) {
          groups.push({
            year: currentYear,
            yearId: yearIdMapLocal[currentYear] ?? null,
            shows: currentGroup,
          })
        }
        setYearGroups(groups)

        const { data: entriesData, error } = await supabase
          .from("setlist_entries")
          .select(
            `
            entry_id,
            entry_song,
            entry_show,
            entry_placement,
            entry_set,
            entry_setnum,
            entry_short,
            songs:entry_song(song_displayname, song_category, song_originalartist, categories:song_category(category_canonid))
          `
          )
          .in("entry_show", showIds)

        if (error) throw error

        const validEntriesRaw = (entriesData ?? []).filter(
          (e: { entry_short?: string | null }) =>
            !e.entry_short ||
            !SKIP_SHORTS.includes(e.entry_short.toLowerCase())
        )

        const validEntries = [...validEntriesRaw].sort(
          (a: { entry_show: string; entry_set?: string; entry_setnum?: number }, b: { entry_show: string; entry_set?: string; entry_setnum?: number }) => {
            const dateA = new Date(
              showDateMap.get(a.entry_show) ?? 0
            ).getTime()
            const dateB = new Date(
              showDateMap.get(b.entry_show) ?? 0
            ).getTime()
            if (dateA !== dateB) return dateA - dateB
            const setA = setOrder(a.entry_set ?? "")
            const setB = setOrder(b.entry_set ?? "")
            if (setA !== setB) return setA - setB
            return (a.entry_setnum ?? 0) - (b.entry_setnum ?? 0)
          }
        )

        const uniqueSongs = [
          ...new Set(validEntries.map((e: { entry_song: string }) => e.entry_song)),
        ].sort()

        const songDisplayNameMap: Record<string, string | null> = {}
        const categoryMap: Record<
          string,
          { category: string; canonid: number; artist?: string }
        > = {}

        for (const e of validEntries as Array<{
          entry_song: string
          songs?: {
            song_displayname?: string | null
            song_category?: string
            song_originalartist?: string
            categories?: { category_canonid?: number }
          }
        }>) {
          const song = e.entry_song
          if (song && !songDisplayNameMap[song]) {
            const songsRel = e.songs
            const songRow = Array.isArray(songsRel) ? songsRel[0] : songsRel
            songDisplayNameMap[song] =
              songRow?.song_displayname?.trim() || null
          }
          if (song && e.songs && !categoryMap[song]) {
            const songsRel = e.songs
            const songRow = Array.isArray(songsRel) ? songsRel[0] : songsRel
            categoryMap[song] = {
              category: songRow?.song_category ?? "Uncategorized",
              canonid: songRow?.categories?.category_canonid ?? 9999,
              artist: songRow?.song_originalartist?.trim(),
            }
          }
        }

        const showDates = sortedShows.map((s) => ({
          id: s.show_id,
          date: s.show_date,
          displayDate: formatShowDate(s.show_date),
        }))

        const matrixData: UserSongMatrixData["data"] = {}
        uniqueSongs.forEach((song) => {
          matrixData[song] = []
        })

        const songVenueAppearances = new Map<string, number>()
        uniqueSongs.forEach((s) => songVenueAppearances.set(s, 0))

        const songFirstAppearance: Record<
          string,
          { showDate: string; entrySet: string; entrySetnum: number }
        > = {}
        const songLastAppearance: Record<
          string,
          { showDate: string; entrySet: string; entrySetnum: number }
        > = {}

        for (const entry of validEntries as Array<{
          entry_song: string
          entry_show: string
          entry_placement?: string | null
          entry_set?: string
          entry_setnum?: number
        }>) {
          const song = entry.entry_song
          const showId = entry.entry_show
          const placement = entry.entry_placement ?? null

          const existing = matrixData[song].find((p) => p.showId === showId)
          if (existing) continue

          const venueCount = (songVenueAppearances.get(song) ?? 0) + 1
          songVenueAppearances.set(song, venueCount)

          const showDate = showDateMap.get(showId) ?? "",
            entrySet = entry.entry_set ?? "",
            entrySetnum = entry.entry_setnum ?? 0

          if (!songFirstAppearance[song]) {
            songFirstAppearance[song] = { showDate, entrySet, entrySetnum }
          }
          songLastAppearance[song] = { showDate, entrySet, entrySetnum }

          matrixData[song].push({
            showId,
            placement,
            count: 1,
            venueAppearanceCount: venueCount,
          })
        }

        setSongMatrix({
          songs: uniqueSongs,
          songDisplayNameMap,
          showDates,
          data: matrixData,
        })

        let sorted: string[]
        switch (sortMode) {
          case "alphabetical":
            sorted = [...uniqueSongs].sort()
            break
          case "playcount":
            sorted = [...uniqueSongs].sort((a, b) => {
              const aShows = matrixData[a]?.length ?? 0
              const bShows = matrixData[b]?.length ?? 0
              if (aShows !== bShows) return bShows - aShows
              const lastA = songLastAppearance[a]
              const lastB = songLastAppearance[b]
              if (!lastA || !lastB) return 0
              const tA = new Date(lastA.showDate).getTime()
              const tB = new Date(lastB.showDate).getTime()
              if (tA !== tB) return tA - tB
              const setCmp = (lastA.entrySet ?? "").localeCompare(
                lastB.entrySet ?? ""
              )
              if (setCmp !== 0) return setCmp
              return (lastA.entrySetnum ?? 0) - (lastB.entrySetnum ?? 0)
            })
            break
          case "chronological":
            sorted = [...uniqueSongs].sort((a, b) => {
              const firstA = songFirstAppearance[a]
              const firstB = songFirstAppearance[b]
              if (!firstA || !firstB) return 0
              const tCmp =
                new Date(firstA.showDate).getTime() -
                new Date(firstB.showDate).getTime()
              if (tCmp !== 0) return tCmp
              const setCmp = firstA.entrySet.localeCompare(firstB.entrySet)
              if (setCmp !== 0) return setCmp
              return firstA.entrySetnum - firstB.entrySetnum
            })
            break
          default:
            sorted = [...uniqueSongs].sort()
        }
        setSortedSongs(sorted)

        const categorySongs: Record<
          string,
          Array<{ song: string; playCount: number; artist?: string }>
        > = {}
        const categoryTotalPerformances: Record<string, number> = {}
        const categoryCanonIds: Record<string, number> = {}

        Object.entries(matrixData).forEach(([song, performances]) => {
          const info = categoryMap[song] ?? {
            category: "Uncategorized",
            canonid: 9999,
          }
          const category = info.category
          const playCount = performances.length

          if (!categorySongs[category]) {
            categorySongs[category] = []
            categoryTotalPerformances[category] = 0
            categoryCanonIds[category] = info.canonid
          }
          categorySongs[category].push({
            song,
            playCount,
            artist: info.artist,
          })
          categoryTotalPerformances[category] += playCount
        })

        const { data: categoriesData } = await supabase
          .from("categories")
          .select("category, category_artwork")
          .in("category", Object.keys(categoryTotalPerformances))

        const categoryArtwork: Record<string, string | null> = {}
        ;(categoriesData ?? []).forEach(
          (c: { category: string; category_artwork?: string | null }) => {
            categoryArtwork[c.category] = c.category_artwork ?? null
          }
        )

        const spreadData: UserSongSpreadCategory[] = Object.keys(
          categoryTotalPerformances
        )
          .map((category) => {
            const showArtist = COVER_CATEGORIES.includes(category)
            const songs = (categorySongs[category] ?? [])
              .sort((a, b) => b.playCount - a.playCount)
              .map(({ song, playCount, artist }) => {
                const displayName =
                  songDisplayNameMap[song]?.trim() || song
                const base =
                  showArtist && artist
                    ? `${displayName} [${artist}]`
                    : displayName
                return `${base} [${playCount}]`
              })
            return {
              category,
              count: categoryTotalPerformances[category],
              canonid: categoryCanonIds[category] ?? 9999,
              songs,
            }
          })
          .sort((a, b) => b.count - a.count || a.canonid - b.canonid)

        setSongSpreadData(spreadData)
      } catch (err) {
        console.error("Error building user song matrix:", err)
        setErrorMessage("Failed to load song matrix data")
      } finally {
        setIsLoading(false)
      }
    }

    buildMatrix()
  }, [shows, sortMode])

  return {
    songMatrix,
    sortedSongs,
    yearGroups,
    yearIdMap,
    songSpreadData,
    isLoading,
    errorMessage,
  }
}
