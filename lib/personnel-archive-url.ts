/**
 * Canonical Setlist Archive URL for a personnel (guest) page. Uses query param
 * `id` (guest UUID).
 */
export function getPersonnelArchiveUrl(guestId: string): string {
  return `/archive/personnel?id=${encodeURIComponent(guestId)}`
}
