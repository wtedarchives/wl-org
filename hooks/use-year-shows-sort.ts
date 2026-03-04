import { useState, useMemo } from "react"
import type { YearShow } from "@/hooks/use-shows-data-by-year"

export type SortColumn =
  | "show_date"
  | "rating"
  | "show_group"
  | "show_subvenue"
  | "show_venue_location"
  | "show_detail"
  | "attendee_count"

export type SortDirection = "asc" | "desc"

export function useYearShowsSort(
  shows: YearShow[],
  attendeeCounts: Record<string, number>,
  showRatings: Record<string, number>,
) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("show_date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  const handleSort = (column: SortColumn) => {
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
        if (comparison !== 0) {
          return sortDirection === "asc" ? comparison : -comparison
        }
      } else if (valueA !== valueB) {
        return sortDirection === "asc"
          ? (valueA as number) - (valueB as number)
          : (valueB as number) - (valueA as number)
      }

      if (sortColumn !== "show_date") {
        const dateA = new Date(a.show_date).getTime()
        const dateB = new Date(b.show_date).getTime()
        if (dateA !== dateB) {
          return sortDirection === "asc" ? dateA - dateB : dateB - dateA
        }
      }

      const canonIdA = a.show_canonid === null ? -1 : a.show_canonid
      const canonIdB = b.show_canonid === null ? -1 : b.show_canonid
      if (canonIdA !== canonIdB) {
        return sortDirection === "asc" ? canonIdA - canonIdB : canonIdB - canonIdA
      }

      const groupA = a.show_group || ""
      const groupB = b.show_group || ""
      return groupA.localeCompare(groupB)
    })
  }, [shows, sortColumn, sortDirection, attendeeCounts, showRatings])

  const sortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) return null
    return sortDirection === "asc" ? "↑" : "↓"
  }

  return { sortedShows, sortColumn, sortDirection, handleSort, sortIndicator }
}
