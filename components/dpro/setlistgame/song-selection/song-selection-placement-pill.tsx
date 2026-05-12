"use client"

import type { ReactNode } from "react"
import { getPlacementBarCssToken } from "@/lib/placement-bar-color"

/** Placement label chip — colors from `setlist-game-wl-v2.css` via `data-placement-bar`. */
export function SongSelectionPlacementPill({
  placement,
  children,
}: {
  placement: string | undefined
  children: ReactNode
}) {
  return (
    <span
      className="song-selection-placement-pill shrink-0"
      data-placement-bar={getPlacementBarCssToken(placement)}
    >
      {children}
    </span>
  )
}
