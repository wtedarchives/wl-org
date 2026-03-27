/**
 * Canonical Setlist Archive URLs for Setlist Game. Legacy path-based URLs
 * redirect via `public/_redirects` on Netlify.
 */
export function getSetlistGameShowArchiveUrl(showId: string): string {
  return `/archive/setlistgame?id=${encodeURIComponent(showId)}`
}

export function getSetlistGameTourArchiveUrl(tourId: string): string {
  return `/archive/setlistgame?tour_id=${encodeURIComponent(tourId)}`
}
