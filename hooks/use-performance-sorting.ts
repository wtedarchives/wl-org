"use client"

import { useState } from "react"
import type { SongPerformance } from "@/types/song"

export function usePerformanceSorting() {
  const [sortColumn, setSortColumn] = useState<string>("show_date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const sortPerformances = (performances: SongPerformance[]) => {
    return [...performances].sort((a, b) => {
      let valueA: any
      let valueB: any

      switch (sortColumn) {
        case "show_date": {
          const dateA = new Date(a.show_date).getTime()
          const dateB = new Date(b.show_date).getTime()
          if (dateA !== dateB) {
            return sortDirection === "asc" ? dateA - dateB : dateB - dateA
          }
          const setA = a.entry_set || ""
          const setB = b.entry_set || ""
          const setComparison = setA.localeCompare(setB)
          if (setComparison !== 0) {
            return sortDirection === "asc" ? setComparison : -setComparison
          }
          const setnumA = parseInt(String(a.entry_setnum || "0"), 10)
          const setnumB = parseInt(String(b.entry_setnum || "0"), 10)
          return sortDirection === "asc"
            ? setnumA - setnumB
            : setnumB - setnumA
        }
        case "show_group":
          valueA = a.show_group || ""
          valueB = b.show_group || ""
          break
        case "show_venue_location":
          valueA = a.show_venue_location || ""
          valueB = b.show_venue_location || ""
          break
        case "entry_song":
          valueA = a.entry_song || ""
          valueB = b.entry_song || ""
          break
        case "entry_set":
          valueA = a.entry_set || ""
          valueB = b.entry_set || ""
          break
        case "entry_length": {
          const timeToSeconds = (timeStr: string | null) => {
            if (!timeStr) return 0
            const parts = timeStr.split(":").map(Number)
            if (parts.length === 3) {
              return parts[0] * 3600 + parts[1] * 60 + parts[2]
            }
            if (parts.length === 2) {
              return parts[0] * 60 + parts[1]
            }
            return 0
          }
          valueA = timeToSeconds(a.entry_length)
          valueB = timeToSeconds(b.entry_length)
          break
        }
        case "gap": {
          const gapA = a.gap
          const gapB = b.gap
          if (gapA === null && gapB === null) return 0
          if (gapA === null) return sortDirection === "asc" ? 1 : -1
          if (gapB === null) return sortDirection === "asc" ? -1 : 1
          if (gapA === "Debut" && gapB === "Debut") return 0
          if (gapA === "Debut") return sortDirection === "asc" ? -1 : 1
          if (gapB === "Debut") return sortDirection === "asc" ? 1 : -1
          valueA = typeof gapA === "number" ? gapA : 0
          valueB = typeof gapB === "number" ? gapB : 0
          break
        }
        case "entry_coachnotes":
          valueA = a.entry_coachnotes || ""
          valueB = b.entry_coachnotes || ""
          break
        default:
          valueA = (a as unknown as Record<string, unknown>)[sortColumn] ?? ""
          valueB = (b as unknown as Record<string, unknown>)[sortColumn] ?? ""
      }

      if (typeof valueA === "string" && typeof valueB === "string") {
        const comparison = valueA.localeCompare(valueB)
        return sortDirection === "asc" ? comparison : -comparison
      }

      const comparison = valueA < valueB ? -1 : valueA > valueB ? 1 : 0
      return sortDirection === "asc" ? comparison : -comparison
    })
  }

  return {
    sortColumn,
    sortDirection,
    handleSort,
    sortPerformances,
  }
}
