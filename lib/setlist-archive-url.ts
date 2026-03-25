/**
 * Canonical Setlist Archive URL for a show. Uses a query param so new shows
 * work without redeploying static export; old `/archive/setlist/:id` URLs
 * redirect via `public/_redirects` on Netlify.
 */
export function getSetlistArchiveUrl(showId: string): string {
  return `/archive/setlist?show_id=${encodeURIComponent(showId)}`
}
