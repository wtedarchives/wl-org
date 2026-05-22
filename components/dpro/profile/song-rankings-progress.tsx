"use client"

import { cn } from "@/lib/utils"

export interface SongRankingsProgressProps {
  active?: boolean
}

export function SongRankingsProgress({ active = false }: SongRankingsProgressProps) {
  return (
    <div
      className={cn(
        "song-rankings-progress",
        active && "song-rankings-progress--active",
      )}
      aria-hidden
    >
      <span className="song-rankings-progress__dot" />
      <span className="song-rankings-progress__dot" />
      <span className="song-rankings-progress__dot" />
    </div>
  )
}
