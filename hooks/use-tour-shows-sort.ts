import { useState, useMemo } from "react"
import type { TourShow } from "@/types/tour"
import { timeToSeconds } from "@/lib/stats/tour-utils"

export type TourSortColumn =
  | "show_date"
  | "rating"
  | "show_group"
  | "show_length"
  | "show_rarity"
  | "show_gap"
  | "show_subvenue"
  | "show_venue_location"
  | "show_detail"
  | "attendee_count"

export type SortDirection = "asc" | "desc"

export function useTourShowsSort(
  shows: TourShow[],
  attendeeCounts: Record<string, number>,
  showRatings: Record<string, number>,
) {
  const [sortColumn, setSortColumn] = useState<TourSortColumn>("show_date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  const handleSort = (column: TourSortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection(column === "rating" ? "desc" : "asc")
    }
  }

  const sortedShows = useMemo(() => {
    return [...shows].sort((a, b) => {
      let valueA: number | string
      let valueB: number | string

      switch (sortColumn) {
        case "show_date":
          valueA = new Date(a.show_date).getTime()
          valueB = new Date(b.show_date).getTime()
          break
        case "rating":
          valueA = showRatings[a.show_id] || 0
          valueB = showRatings[b.show_id] || 0
          break
        case "show_group":
          valueA = a.show_group || ""
          valueB = b.show_group || ""
          break
        case "show_length":
          valueA = timeToSeconds(a.show_length ?? null)
          valueB = timeToSeconds(b.show_length ?? null)
          break
        case "show_rarity":
          valueA =
            a.show_rarity != null
              ? parseFloat(String(a.show_rarity).replace("%", ""))
              : -1
          valueB =
            b.show_rarity != null
              ? parseFloat(String(b.show_rarity).replace("%", ""))
              : -1
          break
        case "show_gap":
          valueA = a.show_gap != null ? parseFloat(String(a.show_gap)) : -1
          valueB = b.show_gap != null ? parseFloat(String(b.show_gap)) : -1
          break
        case "show_subvenue":
          valueA = a.show_subvenue || ""
          valueB = b.show_subvenue || ""
          break
        case "show_venue_location":
          valueA = a.show_venue_location || ""
          valueB = b.show_venue_location || ""
          break
        case "show_detail":
          valueA = a.show_detail || ""
          valueB = b.show_detail || ""
          break
        case "attendee_count":
          valueA = attendeeCounts[a.show_id] || 0
          valueB = attendeeCounts[b.show_id] || 0
          break
        default:
          valueA = new Date(a.show_date).getTime()
          valueB = new Date(b.show_date).getTime()
      }

      if (typeof valueA === "string" && typeof valueB === "string") {
        const comparison = valueA.localeCompare(valueB)
        return sortDirection === "asc" ? comparison : -comparison
      }
      const numA = valueA as number
      const numB = valueB as number
      if (numA !== numB) {
        return sortDirection === "asc" ? numA - numB : numB - numA
      }

      const dateA = new Date(a.show_date).getTime()
      const dateB = new Date(b.show_date).getTime()
      if (dateA !== dateB) {
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA
      }
      const canonIdA = a.show_canonid ?? -1
      const canonIdB = b.show_canonid ?? -1
      if (canonIdA !== canonIdB) return canonIdA - canonIdB
      return (a.show_group || "").localeCompare(b.show_group || "")
    })
  }, [shows, sortColumn, sortDirection, attendeeCounts, showRatings])

  const sortIndicator = (column: TourSortColumn) => {
    if (sortColumn !== column) return null
    return sortDirection === "asc" ? "↑" : "↓"
  }

  return { sortedShows, sortColumn, sortDirection, handleSort, sortIndicator }
}
