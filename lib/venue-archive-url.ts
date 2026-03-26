/**
 * Canonical Setlist Archive URL for a venue detail page. Uses query param `id`
 * (venues `venue_id` UUID or raw `venues.venue` name). Legacy
 * `/archive/venue/:segment` redirects via `public/_redirects` on Netlify.
 */
export function getVenueArchiveUrl(venueKey: string): string {
  return `/archive/venue?id=${encodeURIComponent(venueKey)}`
}
