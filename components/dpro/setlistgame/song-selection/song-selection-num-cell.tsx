"use client"

import { getPlacementBarCssToken } from "@/lib/placement-bar-color"

/** `#` display matching WL archive setlist `td.num-cell` (left placement bar + Geist Mono digit). */
export function SongSelectionNumCell({
  placement,
  n,
}: {
  placement: string | undefined
  n: number
}) {
  const token = getPlacementBarCssToken(placement)
  return (
    <span className="song-selection-num-cell shrink-0">
      <span
        className="song-selection-num-cell-bar"
        data-placement-bar={token}
        aria-hidden
      />
      <span className="song-selection-num-cell-digit tabular-nums">{n}</span>
    </span>
  )
}
