import type { TourShow } from "@/types/tour"

export function parseTourShowRarity(
  showRarity: TourShow["show_rarity"],
): { numeric: number; pctStr: string | null } {
  const numeric =
    showRarity != null && String(showRarity).trim() !== ""
      ? Number.parseFloat(String(showRarity).replace(/%/g, "").trim())
      : NaN

  const pctStr = Number.isFinite(numeric) ? `${numeric.toFixed(2)}%` : null

  return { numeric, pctStr }
}

export function parseTourShowGap(
  showGap: TourShow["show_gap"],
): number {
  return showGap != null && String(showGap).trim() !== ""
    ? Number.parseFloat(String(showGap).trim())
    : NaN
}
