"use client"

import { useState } from "react"
import {
  SongSpreadDisplay,
  type CategorySpread,
} from "@/components/dpro/song-spread-display"
import type { UserSongSpreadCategory } from "@/hooks/use-user-song-matrix"

interface UserSongSpreadProps {
  songSpreadData: UserSongSpreadCategory[]
}

export function UserSongSpread({ songSpreadData }: UserSongSpreadProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  const spread: CategorySpread[] = songSpreadData

  if (spread.length === 0) return null

  return (
    <div className="wl-profile-songs-spread">
      <h3 className="wl-profile-songs-spread__head">Song Spread</h3>
      <div className="wl-profile-songs-spread__body">
        <SongSpreadDisplay
          spread={spread}
          hoveredCategory={hoveredCategory}
          onCategoryHover={setHoveredCategory}
          variant="wl-home-v2-setlist"
          tooltipSide="left"
          constrainListHeight={false}
        />
      </div>
    </div>
  )
}
