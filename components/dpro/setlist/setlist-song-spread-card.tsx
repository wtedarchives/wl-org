"use client"

import { useMemo } from "react"
import {
  SongSpreadDisplay,
  type CategorySpread,
} from "@/components/dpro/song-spread-display"
import type { SetlistEntry } from "@/types/setlist"
import { INDEX_SKIP_SONG_IMPROV_JAM } from "@/components/dpro/setlist/display-setlist-table.constants"

const EXCLUDED_SHORTS = ["aborted", "fake", "reprise", "tease"]
const COVER_CATEGORIES = ["Cover Songs", "Miscellaneous Covers"]

interface SetlistSongSpreadCardProps {
  setlist: SetlistEntry[]
  hoveredCategory?: string | null
  onCategoryHover?: (category: string | null) => void
  /**
   * WTED episode playlist: count every row (no improv/jam or short-label exclusions,
   * and repeated songs each count toward their category).
   */
  includeAllEpisodeEntries?: boolean
}

export function SetlistSongSpreadCard({
  setlist,
  hoveredCategory = null,
  onCategoryHover,
  includeAllEpisodeEntries = false,
}: SetlistSongSpreadCardProps) {
  const spread = useMemo((): CategorySpread[] => {
    const source = includeAllEpisodeEntries
      ? setlist
      : setlist.filter((entry) => {
          if (entry.entry_song === INDEX_SKIP_SONG_IMPROV_JAM) return false
          const short = (entry.entry_short ?? "").toLowerCase().trim()
          return !EXCLUDED_SHORTS.includes(short)
        })

    const counts: Record<string, number> = {}
    const songsByCategory: Record<string, string[]> = {}
    const canonids: Record<string, number> = {}
    const seenSongs = new Set<string>()

    for (const entry of source) {
      const category = entry.songs?.song_category ?? "undefined"
      const songKey = entry.entry_song

      if (!includeAllEpisodeEntries) {
        if (seenSongs.has(songKey)) continue
        seenSongs.add(songKey)
      }
      counts[category] = (counts[category] ?? 0) + 1

      if (!songsByCategory[category]) {
        songsByCategory[category] = []
        canonids[category] = entry.category_canonid ?? 0
      }
      const rawArtist = entry.songs?.song_originalartist?.trim()
      const artist =
        rawArtist === "[Traditional]" ? "Traditional" : rawArtist
      const showArtist = COVER_CATEGORIES.includes(category) && artist
      const displayName =
        entry.songs?.song_displayname?.trim() || songKey
      const label = showArtist ? `${displayName} [${artist}]` : displayName
      songsByCategory[category].push(label)
    }

    return Object.entries(counts)
      .map(([category, count]) => ({
        category,
        count,
        canonid: canonids[category] ?? 0,
        songs: [...(songsByCategory[category] ?? [])].sort((a, b) =>
          a.localeCompare(b)
        ),
      }))
      .sort((a, b) => b.count - a.count || a.canonid - b.canonid)
  }, [setlist, includeAllEpisodeEntries])

  return (
    <SongSpreadDisplay
      spread={spread}
      hoveredCategory={hoveredCategory}
      onCategoryHover={onCategoryHover}
    />
  )
}
