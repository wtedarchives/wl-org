import type { PlayerStats, SortField, SortDirection } from "./standings-types"

export function sortStandings(
  data: PlayerStats[],
  field: SortField,
  direction: SortDirection
): PlayerStats[] {
  return [...data].sort((a, b) => {
    let comparison = 0

    const aVal = a[field]
    const bVal = b[field]
    if (aVal < bVal) comparison = -1
    else if (aVal > bVal) comparison = 1

    comparison = direction === "asc" ? comparison : -comparison

    if (comparison === 0) {
      if (field !== "totalPoints") {
        if (a.totalPoints > b.totalPoints) return -1
        if (a.totalPoints < b.totalPoints) return 1
      }
      if (field !== "avgPointsPerShow") {
        if (a.avgPointsPerShow > b.avgPointsPerShow) return -1
        if (a.avgPointsPerShow < b.avgPointsPerShow) return 1
      }
      if (field !== "songsPicked") {
        if (a.songsPicked > b.songsPicked) return -1
        if (a.songsPicked < b.songsPicked) return 1
      }
      return a.username.localeCompare(b.username)
    }

    return comparison
  })
}
