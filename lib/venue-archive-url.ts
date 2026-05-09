/**
 * Canonical Setlist Archive URL for a venue detail page. Uses query param `id`
 * (venues `venue_id` UUID or raw `venues.venue` name). Legacy
 * `/old/archive/venue?id=` — client redirect + `public/_redirects` send traffic here; prefer
 * `getVenueArchiveUrl` for all links.
 */
export function getVenueArchiveUrl(venueKey: string): string {
  return `/archive/venue?id=${encodeURIComponent(venueKey)}`
}
