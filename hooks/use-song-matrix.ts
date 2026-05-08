"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { INDEX_SKIP_SONG_IMPROV_JAM } from "@/components/dpro/setlist/display-setlist-table.constants"
function formatShowDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z")
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${m}.${day}`
}

export type SongMatrixShowInput = {
  show_id: string
  show_date: string
  show_canonid?: number | null
}

function canonSortKey(c: number | null | undefined): number {
  return c == null ? Number.MAX_SAFE_INTEGER : c
}

/** Same calendar date → lower `show_canonid` first; null canon after real ids. */
export function compareTourMatrixShows(
  a: SongMatrixShowInput,
  b: SongMatrixShowInput,
): number {
  const d =
    new Date(a.show_date).getTime() - new Date(b.show_date).getTime()
  if (d !== 0) return d
  return canonSortKey(a.show_canonid) - canonSortKey(b.show_canonid)
}

export interface SongMatrixData {
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

export function useSongMatrix(
  shows: SongMatrixShowInput[],
  sortMode: "alphabetical" | "chronological" | "playcount" = "alphabetical",
) {
  const [songMatrix, setSongMatrix] = useState<SongMatrixData>({
    songs: [],
    songDisplayNameMap: {},
    showDates: [],
    data: {},
  })
  const [sortedSongs, setSortedSongs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!shows?.length) {
      setIsLoading(false)
      return
    }

    async function buildSongMatrix() {
      try {
        if (!supabase) {
          setIsLoading(false)
          return
        }

        const showIds = shows.map((s) => s.show_id)
        const showDateMap = new Map(shows.map((s) => [s.show_id, s.show_date]))
        const showCanonMap = new Map(
          shows.map((s) => [s.show_id, s.show_canonid ?? null]),
        )

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
            shows(show_date),
            songs:entry_song(song_displayname)
          `,
          )
          .in("entry_show", showIds)

        if (error) throw error

        const skipShorts = ["fake", "tease", "reprise", "aborted"]
        const validEntriesRaw = (entriesData ?? []).filter(
          (e: any) =>
            e.entry_song !== INDEX_SKIP_SONG_IMPROV_JAM &&
            (!e.entry_short || !skipShorts.includes(e.entry_short.toLowerCase())),
        )

        /** Set order for chronological sort: 1,2,3,4,5 then E1,E2,E3 */
        const setOrder = (set: string): number => {
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

        const validEntries = [...validEntriesRaw].sort((a: any, b: any) => {
          const dateA = new Date(showDateMap.get(a.entry_show) ?? 0).getTime()
          const dateB = new Date(showDateMap.get(b.entry_show) ?? 0).getTime()
          if (dateA !== dateB) return dateA - dateB
          const canonA = canonSortKey(showCanonMap.get(a.entry_show))
          const canonB = canonSortKey(showCanonMap.get(b.entry_show))
          if (canonA !== canonB) return canonA - canonB
          const setA = setOrder(a.entry_set)
          const setB = setOrder(b.entry_set)
          if (setA !== setB) return setA - setB
          return (a.entry_setnum ?? 0) - (b.entry_setnum ?? 0)
        })

        const uniqueSongs = [
          ...new Set(validEntries.map((e: any) => e.entry_song)),
        ].sort()

        const songDisplayNameMap: Record<string, string | null> = {}
        for (const e of validEntries as any[]) {
          const song = e.entry_song
          if (song && !songDisplayNameMap[song]) {
            const songsRel = e.songs
            const songRow = Array.isArray(songsRel) ? songsRel[0] : songsRel
            songDisplayNameMap[song] =
              songRow?.song_displayname?.trim() || null
          }
        }

        const sortedShows = [...shows].sort(compareTourMatrixShows)

        const showDates = sortedShows.map((s) => ({
          id: s.show_id,
          date: s.show_date,
          displayDate: formatShowDate(s.show_date),
        }))

        const matrixData: SongMatrixData["data"] = {}
        uniqueSongs.forEach((song) => {
          matrixData[song] = []
        })

        const songVenueAppearances = new Map<string, number>()
        uniqueSongs.forEach((s) => songVenueAppearances.set(s, 0))

        const songFirstAppearance: Record<
          string,
          {
            showDate: string
            showCanonid: number | null
            entrySet: string
            entrySetnum: number
          }
        > = {}
        const songLastAppearance: Record<
          string,
          {
            showDate: string
            showCanonid: number | null
            entrySet: string
            entrySetnum: number
          }
        > = {}

        for (const entry of validEntries as any[]) {
          const song = entry.entry_song
          const showId = entry.entry_show
          const placement = entry.entry_placement ?? null
          const key = `${song}|${showId}`

          const existing = matrixData[song].find((p) => p.showId === showId)
          if (existing) {
            /** One cell per show: keep first occurrence's placement; do not overwrite */
            continue
          }

          const venueCount = (songVenueAppearances.get(song) ?? 0) + 1
          songVenueAppearances.set(song, venueCount)

          if (!songFirstAppearance[song]) {
            songFirstAppearance[song] = {
              showDate: showDateMap.get(showId) ?? "",
              showCanonid: showCanonMap.get(showId) ?? null,
              entrySet: entry.entry_set ?? "",
              entrySetnum: entry.entry_setnum ?? 0,
            }
          }
          songLastAppearance[song] = {
            showDate: showDateMap.get(showId) ?? "",
            showCanonid: showCanonMap.get(showId) ?? null,
            entrySet: entry.entry_set ?? "",
            entrySetnum: entry.entry_setnum ?? 0,
          }

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
              const canonCmp =
                canonSortKey(lastA.showCanonid) - canonSortKey(lastB.showCanonid)
              if (canonCmp !== 0) return canonCmp
              const setCmp = (lastA.entrySet ?? "").localeCompare(
                lastB.entrySet ?? "",
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
              const canonCmp =
                canonSortKey(firstA.showCanonid) -
                canonSortKey(firstB.showCanonid)
              if (canonCmp !== 0) return canonCmp
              const setCmp = firstA.entrySet.localeCompare(firstB.entrySet)
              if (setCmp !== 0) return setCmp
              return firstA.entrySetnum - firstB.entrySetnum
            })
            break
          default:
            sorted = [...uniqueSongs].sort()
        }
        setSortedSongs(sorted)
      } catch (err) {
        console.error("Error building song matrix:", err)
        setErrorMessage("Failed to load song matrix data")
      } finally {
        setIsLoading(false)
      }
    }

    buildSongMatrix()
  }, [shows, sortMode])

  return {
    songMatrix,
    sortedSongs,
    isLoading,
    errorMessage,
  }
}
