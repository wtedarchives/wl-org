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
    <SongSpreadDisplay
      spread={spread}
      hoveredCategory={hoveredCategory}
      onCategoryHover={setHoveredCategory}
      cardMaxHeight="max-h-[400px] md:max-h-none"
    />
  )
}
