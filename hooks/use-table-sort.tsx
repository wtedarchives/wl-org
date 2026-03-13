"use client"

import { useState } from "react"
import { ArrowUp, ArrowDown } from "lucide-react"
import type { AttendShow } from "./use-attend-show-data"

export type SortColumn =
  | "show_date"
  | "show_group"
  | "show_subvenue"
  | "show_venue_location"
export type SortDirection = "asc" | "desc"

export function useTableSort() {
  const [sortColumn, setSortColumn] = useState<SortColumn>("show_date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return null
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 inline-block size-4 text-muted-foreground" />
    ) : (
      <ArrowDown className="ml-1 inline-block size-4 text-muted-foreground" />
    )
  }

  return { sortColumn, sortDirection, handleSort, getSortIcon }
}

export function getFilteredAndSortedShows(
  shows: AttendShow[],
  searchQuery: string,
  sortColumn: SortColumn,
  sortDirection: SortDirection
): AttendShow[] {
  let filtered = shows
  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    filtered = shows.filter(
      (s) =>
        s.show_subvenue.toLowerCase().includes(q) ||
        s.show_venue_location.toLowerCase().includes(q) ||
        s.show_group.toLowerCase().includes(q) ||
        (s.show_detail?.toLowerCase().includes(q) ?? false)
    )
  }

  return [...filtered].sort((a, b) => {
    let aVal: string | number = a[sortColumn]
    let bVal: string | number = b[sortColumn]
    if (sortColumn === "show_date") {
      aVal = new Date(aVal).getTime()
      bVal = new Date(bVal).getTime()
    }
    if (aVal == null) aVal = ""
    if (bVal == null) bVal = ""
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    return sortDirection === "desc" ? cmp : -cmp
  })
}
