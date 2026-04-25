/**
 * Canonical Setlist Archive URL for a show. Uses query param `id` so new shows
 * work without redeploying static export; old `/old/archive/setlist/:id` and
 * `?show_id=` URLs are redirected or normalized via `public/_redirects` and the
 * setlist page client.
 */
export function getSetlistArchiveUrl(showId: string): string {
  return `/archive/setlist?id=${encodeURIComponent(showId)}`
}
