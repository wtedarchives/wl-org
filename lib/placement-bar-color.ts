/**
 * Stable token for CSS `[data-placement-bar]` (setlist `#` column + WL v2 inset bar).
 * Maps to `getPlacementBarColor` / archive `.display-setlist-num-cell`.
 */
export type PlacementBarCssToken =
  | "set-1-opener"
  | "set-1-closer"
  | "set-opener"
  | "set-closer"
  | "encore-1"
  | "encore-23"
  | "none"

/**
 * Bar / #-column / inset colors for setlist placement labels (matches DB `placements`).
 * Set 2+ opener/closer share the same greens/blues; Set 1 is distinct.
 */
export function getPlacementBarColor(placement: string | null | undefined): string {
  if (!placement) return "transparent"
  if (placement === "Set 1 Opener") return "#047857"
  if (placement === "Set 1 Closer") return "#1e40af"
  const openerN = /^Set (\d+) Opener$/.exec(placement)?.[1]
  if (openerN && openerN !== "1") return "#10b981"
  const closerN = /^Set (\d+) Closer$/.exec(placement)?.[1]
  if (closerN && closerN !== "1") return "#3b82f6"
  if (placement === "Encore 1") return "#be123c"
  if (placement === "Encore 2" || placement === "Encore 3") return "#f43f5e"
  return "transparent"
}

/** Token for CSS selectors; use with `[data-placement-bar="…"]`. */
export function getPlacementBarCssToken(
  placement: string | null | undefined,
): PlacementBarCssToken {
  if (!placement) return "none"
  if (placement === "Set 1 Opener") return "set-1-opener"
  if (placement === "Set 1 Closer") return "set-1-closer"
  const openerN = /^Set (\d+) Opener$/.exec(placement)?.[1]
  if (openerN && openerN !== "1") return "set-opener"
  const closerN = /^Set (\d+) Closer$/.exec(placement)?.[1]
  if (closerN && closerN !== "1") return "set-closer"
  if (placement === "Encore 1") return "encore-1"
  if (placement === "Encore 2" || placement === "Encore 3") return "encore-23"
  return "none"
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.trim().replace(/^#/, "")
  if (h.length !== 6) return null
  const n = Number.parseInt(h, 16)
  if (Number.isNaN(n)) return null
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

/**
 * Fill + border for `TourShowsStatPill` / tour-dates–style stat chips on placement labels.
 */
export function getPlacementBarPillColors(
  placement: string | null | undefined,
): { fill: string; border: string } {
  const hex = getPlacementBarColor(placement)
  if (!hex || hex === "transparent") {
    return {
      fill: "rgba(255, 255, 255, 0.08)",
      border: "rgb(49, 51, 49)",
    }
  }
  const rgb = hexToRgb(hex)
  if (!rgb) {
    return { fill: hex, border: "rgba(255, 255, 255, 0.35)" }
  }
  const { r, g, b } = rgb
  return {
    fill: `rgba(${r}, ${g}, ${b}, 0.4)`,
    border: `rgba(${r}, ${g}, ${b}, 0.92)`,
  }
}
