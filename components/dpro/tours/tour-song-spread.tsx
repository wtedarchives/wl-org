"use client"

import { useMemo, useState } from "react"
import {
  SongSpreadDisplay,
  type CategorySpread,
} from "@/components/dpro/song-spread-display"

const SKIP_SHORTS = ["fake", "tease", "reprise", "aborted"]
const COVER_CATEGORIES = ["Cover Songs", "Miscellaneous Covers"]

interface TourSongSpreadProps {
  shows: Array<{
    show_id: string
    setlist_entries?: Array<{
      entry_song: string
      entry_short?: string | null
      songs?: {
        song_category?: string
        song_displayname?: string | null
        song_originalartist?: string | null
        categories?: { category_canonid?: number }
      }
    }>
  }>
}

export function TourSongSpread({ shows }: TourSongSpreadProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  const spread = useMemo((): CategorySpread[] => {
    const counts: Record<string, number> = {}
    const songsByCategory: Record<
      string,
      { song: string; displayName: string; artist?: string; playCount: number }[]
    > = {}
    const canonids: Record<string, number> = {}

    for (const show of shows) {
      const songsWithValidPerformance = new Set<string>()
      show.setlist_entries?.forEach((entry) => {
        if (
          !entry.entry_short ||
          !SKIP_SHORTS.includes(entry.entry_short.toLowerCase())
        ) {
          songsWithValidPerformance.add(entry.entry_song)
        }
      })

      const showSongKeys = new Set<string>()
      show.setlist_entries?.forEach((entry) => {
        if (!songsWithValidPerformance.has(entry.entry_song)) return
        const songKey = `${entry.entry_song}-${entry.songs?.song_category ?? ""}`
        const category = entry.songs?.song_category || "undefined"
        if (!showSongKeys.has(songKey)) {
          showSongKeys.add(songKey)
          counts[category] = (counts[category] ?? 0) + 1
          if (!songsByCategory[category]) {
            songsByCategory[category] = []
            canonids[category] =
              entry.songs?.categories?.category_canonid ?? 0
          }
          const artist =
            entry.songs?.song_originalartist?.trim() === "[Traditional]"
              ? "Traditional"
              : entry.songs?.song_originalartist?.trim()
          const showArtist = COVER_CATEGORIES.includes(category) && artist
          const displayName =
            entry.songs?.song_displayname?.trim() || entry.entry_song
          const existing = songsByCategory[category].findIndex(
            (s) => s.song === entry.entry_song,
          )
          if (existing === -1) {
            songsByCategory[category].push({
              song: entry.entry_song,
              displayName,
              artist: showArtist ? artist : undefined,
              playCount: 1,
            })
          } else {
            songsByCategory[category][existing].playCount++
          }
        }
      })
    }

    return Object.entries(counts)
      .map(([category, count]) => {
        const showArtist = COVER_CATEGORIES.includes(category)
        const songs = (songsByCategory[category] ?? [])
          .sort((a, b) => a.song.localeCompare(b.song))
          .map(({ displayName, artist, playCount }) => {
            const base =
              showArtist && artist ? `${displayName} [${artist}]` : displayName
            return `${base} [${playCount}]`
          })
        return {
          category,
          count,
          canonid: canonids[category] ?? 0,
          songs,
        }
      })
      .sort((a, b) => b.count - a.count || a.canonid - b.canonid)
  }, [shows])

  return (
    <SongSpreadDisplay
      spread={spread}
      hoveredCategory={hoveredCategory}
      onCategoryHover={setHoveredCategory}
    />
  )
}
