"use client"

import { useMemo, useState } from "react"
import { SongSpreadDisplay } from "@/components/dpro/song-spread-display"
import { computeTourSongSpreadFromShows } from "@/lib/stats/tour-song-spread-compute"

interface TourSongSpreadProps {
  /** When set, caps overall card height and scrolls the list (e.g. `max-h-[325px]` for stats grid). */
  cardMaxHeight?: string
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

export function TourSongSpread({ shows, cardMaxHeight }: TourSongSpreadProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  const spread = useMemo(
    () => computeTourSongSpreadFromShows(shows),
    [shows],
  )

  return (
    <SongSpreadDisplay
      spread={spread}
      hoveredCategory={hoveredCategory}
      onCategoryHover={setHoveredCategory}
      cardMaxHeight={cardMaxHeight}
    />
  )
}
