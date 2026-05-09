import type { ReadonlyURLSearchParams } from "next/navigation"
import type { GuestShow } from "@/hooks/use-guest-data"

export interface GuestTimelinePerf {
  formattedDate: string
  show_id: string
  fullData: GuestShow
}

export function sortGuestShows(
  performances: GuestShow[],
  sortColumn: string,
  sortDirection: "asc" | "desc",
): GuestShow[] {
  return [...performances].sort((a, b) => {
    let valueA: string | number
    let valueB: string | number

    switch (sortColumn) {
      case "show_date":
        valueA = new Date(a.show_date).getTime()
        valueB = new Date(b.show_date).getTime()
        return sortDirection === "asc"
          ? (valueA as number) - (valueB as number)
          : (valueB as number) - (valueA as number)
      case "show_group":
        valueA = a.show_group || ""
        valueB = b.show_group || ""
        break
      case "show_venue_location":
        valueA = a.show_venue_location || ""
        valueB = b.show_venue_location || ""
        break
      default:
        valueA = new Date(a.show_date).getTime()
        valueB = new Date(b.show_date).getTime()
        return sortDirection === "asc"
          ? (valueA as number) - (valueB as number)
          : (valueB as number) - (valueA as number)
    }

    const comparison =
      typeof valueA === "string" && typeof valueB === "string"
        ? valueA.localeCompare(valueB)
        : valueA < valueB
          ? -1
          : valueA > valueB
            ? 1
            : 0
    return sortDirection === "asc" ? comparison : -comparison
  })
}

export function getLegacyPerformancesViewFromUrl(
  sp: Pick<ReadonlyURLSearchParams, "get">,
): "timeline" | "table" {
  const viewParam = sp.get("view")
  return viewParam === "table" || viewParam === "timeline" ? viewParam : "timeline"
}
