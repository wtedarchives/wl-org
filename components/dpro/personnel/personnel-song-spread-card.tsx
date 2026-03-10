"use client"

import { useState, useMemo } from "react"
import {
  SongSpreadDisplay,
  type CategorySpread,
} from "@/components/dpro/song-spread-display"
import type { SongSpreadCategory } from "@/hooks/use-guest-data"

const COVER_CATEGORIES = ["Cover Songs", "Miscellaneous Covers"]

interface PersonnelSongSpreadCardProps {
  songSpreadData: SongSpreadCategory[]
}

export function PersonnelSongSpreadCard({
  songSpreadData,
}: PersonnelSongSpreadCardProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  const spread: CategorySpread[] = useMemo(
    () =>
      [...songSpreadData]
        .sort((a, b) => {
          if (b.count !== a.count) return b.count - a.count
          return a.canonid - b.canonid
        })
        .map((cat) => {
          const showArtist = COVER_CATEGORIES.includes(cat.category)
          const songsFormatted = cat.songs.map(
            ({ song, song_displayname, artist, playCount }) => {
              const displayName = song_displayname?.trim() || song
              const base =
                showArtist && artist ? `${displayName} [${artist}]` : displayName
              return `${base} [${playCount}]`
            },
          )
          return {
            category: cat.category,
            count: cat.count,
            canonid: cat.canonid,
            songs: songsFormatted,
          }
        }),
    [songSpreadData],
  )

  if (spread.length === 0) return null

  return (
    <SongSpreadDisplay
      spread={spread}
      hoveredCategory={hoveredCategory}
      onCategoryHover={setHoveredCategory}
      cardMaxHeight="max-h-[400px]"
    />
  )
}
