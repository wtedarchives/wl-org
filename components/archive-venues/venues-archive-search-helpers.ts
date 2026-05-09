import type { VenueRow } from "@/hooks/use-venues-data"

/** Filter, sort, cap — same pattern as {@link personnelArchiveSearchHits}. */
export function venuesArchiveSearchHits(
  rows: readonly VenueRow[],
  query: string,
): VenueRow[] {
  const q = query.trim().toLowerCase()
  let list = [...rows]
  if (q) {
    list = list.filter((r) => {
      const name = r.subvenue.toLowerCase()
      const venue = r.subvenue_venue.toLowerCase()
      const loc = r.subvenue_venue_location.toLowerCase()
      return name.includes(q) || venue.includes(q) || loc.includes(q)
    })
  }
  list.sort((a, b) => a.subvenue.localeCompare(b.subvenue))
  return list.slice(0, 60)
}
