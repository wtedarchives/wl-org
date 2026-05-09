/**
 * Canonical Setlist Archive URL for a personnel (guest) page. Uses query param
 * `id` (guest UUID). Legacy `/old/archive/personnel/...` still 301s via
 * `public/_redirects` where configured.
 */
export function getPersonnelArchiveUrl(guestId: string): string {
  return `/archive/personnel?id=${encodeURIComponent(guestId)}`
}
