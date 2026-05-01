import { songDetailPlacementLegendSwatch } from "@/lib/song-detail-placement-chip"

export function placementStatsForVerbatimBar(
  placementStats: Array<{
    placement: string
    count: number
    percentage: number
    order?: number
  }>,
): Array<{ placement: string; count: number; pct: number; flex: number }> {
  const sorted = [...placementStats].sort((a, b) => {
    if (a.order != null && b.order != null) return a.order - b.order
    if (a.order != null) return -1
    if (b.order != null) return 1
    return b.count - a.count
  })
  const total = sorted.reduce((s, x) => s + x.count, 0) || 1
  return sorted.map((s) => ({
    placement: s.placement,
    count: s.count,
    pct: s.percentage,
    flex: Math.max(1, Math.round((s.count / total) * 100)),
  }))
}

export function placementLegendRows(
  placementStats: Array<{
    placement: string
    count: number
    percentage: number
    order?: number
  }>,
) {
  const sorted = [...placementStats].sort((a, b) => {
    if (a.order != null && b.order != null) return a.order - b.order
    if (a.order != null) return -1
    if (b.order != null) return 1
    return b.count - a.count
  })
  return sorted.map((s) => ({
    placement: s.placement,
    count: s.count,
    pct: s.percentage,
    swatch: songDetailPlacementLegendSwatch(s.placement),
  }))
}
