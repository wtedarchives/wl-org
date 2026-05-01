import type { CSSProperties } from "react"

import { getPlacementBarColor } from "@/lib/placement-bar-color"

/**
 * Maps DB `placements` labels to verbatim `Song.html` / `song-detail.js` chip keys
 * for timeline + table CSS (opener, setopener, mainset, …).
 */
export type SongDetailPlacementChip =
  | "opener"
  | "setopener"
  | "setcloser"
  | "mainset"
  | "encore"
  | "closer"

export function getSongDetailPlacementChipClass(
  placement: string | null | undefined,
): SongDetailPlacementChip {
  const p = placement?.trim() ?? ""
  if (!p) return "mainset"
  if (p.startsWith("Main Set")) return "mainset"
  if (p === "Set 1 Opener") return "opener"
  const opener = /^Set (\d+) Opener$/.exec(p)
  if (opener && opener[1] !== "1") return "setopener"
  if (p === "Set 1 Closer") return "setcloser"
  const closer = /^Set (\d+) Closer$/.exec(p)
  if (closer && closer[1] !== "1") return "setcloser"
  if (p.startsWith("Encore")) return "encore"
  return "mainset"
}

/** Legend / stacked bar segment fill — same hex mapping as setlist `#` column (`placement-bar-color`). */
export function songDetailPlacementLegendSwatch(
  placement: string | null | undefined,
): string {
  const c = getPlacementBarColor(placement)
  return c !== "transparent" ? c : "rgba(255,255,255,0.15)"
}

/**
 * Timeline chips + perf-table placement pills: backgrounds aligned with setlist placement colors.
 * `mainset` uses verbatim CSS only.
 */
export function songDetailPlacementChipSurfaceStyle(
  placement: string | null | undefined,
  chip: SongDetailPlacementChip,
): CSSProperties | undefined {
  if (chip === "mainset") return undefined
  const c = getPlacementBarColor(placement)
  if (c !== "transparent") {
    return { backgroundColor: c, color: "#fff" }
  }
  return {
    backgroundColor: "rgba(255,255,255,0.15)",
    color: "rgba(255,255,255,0.78)",
  }
}
