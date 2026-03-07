"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
function formatShowDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z")
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${m}.${day}`
}

export interface SongMatrixData {
  songs: string[]
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
  shows: Array<{ show_id: string; show_date: string }>,
  sortMode: "alphabetical" | "chronological" | "playcount" = "alphabetical",
) {
  const [songMatrix, setSongMatrix] = useState<SongMatrixData>({
    songs: [],
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
            shows(show_date)
          `,
          )
          .in("entry_show", showIds)
          .order("entry_song", { ascending: true })

        if (error) throw error

        const skipShorts = ["fake", "tease", "reprise", "aborted"]
        const validEntries = (entriesData ?? []).filter(
          (e: any) =>
            !e.entry_short || !skipShorts.includes(e.entry_short.toLowerCase()),
        )

        const uniqueSongs = [
          ...new Set(validEntries.map((e: any) => e.entry_song)),
        ].sort()

        const sortedShows = [...shows].sort(
          (a, b) =>
            new Date(a.show_date).getTime() - new Date(b.show_date).getTime(),
        )

        const showDates = sortedShows.map((s) => ({
          id: s.show_id,
          date: s.show_date,
          displayDate: formatShowDate(s.show_date),
        }))

        const matrixData: SongMatrixData["data"] = {}
        uniqueSongs.forEach((song) => {
          matrixData[song] = []
        })

        const songShowCountMap = new Map<string, number>()
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

        for (const entry of validEntries as any[]) {
          const song = entry.entry_song
          const showId = entry.entry_show
          const placement = entry.entry_placement
          const key = `${song}|${showId}`
          const currentCount = songShowCountMap.get(key) ?? 0

          let venueCount = songVenueAppearances.get(song) ?? 0
          if (currentCount === 0) {
            venueCount += 1
            songVenueAppearances.set(song, venueCount)
            if (!songFirstAppearance[song]) {
              songFirstAppearance[song] = {
                showDate: showDateMap.get(showId) ?? "",
                entrySet: entry.entry_set ?? "",
                entrySetnum: entry.entry_setnum ?? 0,
              }
            }
            songLastAppearance[song] = {
              showDate: showDateMap.get(showId) ?? "",
              entrySet: entry.entry_set ?? "",
              entrySetnum: entry.entry_setnum ?? 0,
            }
          }

          songShowCountMap.set(key, currentCount + 1)

          const existing = matrixData[song].find((p) => p.showId === showId)
          if (!existing) {
            matrixData[song].push({
              showId,
              placement,
              count: currentCount + 1,
              venueAppearanceCount: venueCount,
            })
          } else {
            existing.count = currentCount + 1
          }
        }

        setSongMatrix({
          songs: uniqueSongs,
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
