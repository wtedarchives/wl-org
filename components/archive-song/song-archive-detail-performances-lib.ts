import { formatSetlistDate } from "@/lib/setlist-utils"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"
import type { SongPerformance } from "@/types/song"

/** WL Home v2 song detail: `/archive/song?id=…&performances=table` (omit or `timeline` for timeline). */
export const PERFORMANCES_VIEW_QUERY = "performances"

export function performancesViewFromSearchParams(
  searchParams: URLSearchParams,
): "timeline" | "table" {
  const raw = searchParams.get(PERFORMANCES_VIEW_QUERY)?.trim().toLowerCase()
  return raw === "table" ? "table" : "timeline"
}

export type TimelineSegment =
  | { kind: "year"; year: number }
  | { kind: "gap"; afterYear: number; beforeYear: number }

export function buildTimelineSegments(sortedYears: number[]): TimelineSegment[] {
  const out: TimelineSegment[] = []
  for (let i = 0; i < sortedYears.length; i++) {
    const y = sortedYears[i]!
    out.push({ kind: "year", year: y })
    const next = sortedYears[i + 1]
    if (next !== undefined && next - y > 1) {
      out.push({ kind: "gap", afterYear: y, beforeYear: next })
    }
  }
  return out
}

export function formatChipDate(showDate: string): string {
  const f = formatSetlistDate(showDate)
  return f.length >= 5 ? f.slice(0, 5) : f
}

export function performanceVenueHref(p: SongPerformance): string | null {
  if (p.venue_id) return getVenueArchiveUrl(p.venue_id)
  if (p.show_subvenue_venue) return getVenueArchiveUrl(p.show_subvenue_venue)
  const venueSearchTerm = p.show_subvenue || p.show_venue_location
  if (venueSearchTerm) return getVenueArchiveUrl(venueSearchTerm)
  return null
}

/** Same predicate for timeline chips and table rows (group vs placement filters). */
export function perfMatchesSongArchiveFilters(
  p: SongPerformance,
  selectedGroup: string | null,
  selectedPlacement: string | null,
): boolean {
  const groupOk = !selectedGroup || p.show_group === selectedGroup
  const placementOk =
    !selectedPlacement ||
    (p.entry_placement === selectedPlacement && p.show_canonid != null)
  return groupOk && placementOk
}
