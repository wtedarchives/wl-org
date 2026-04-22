/**
 * Canonical Setlist Archive URL for a personnel (guest) page. Uses query param
 * `id` (guest UUID). Legacy `/old/archive/personnel/:guest_id` redirects via
 * `public/_redirects` on Netlify.
 */
export function getPersonnelArchiveUrl(guestId: string): string {
  return `/old/archive/personnel?id=${encodeURIComponent(guestId)}`
}
