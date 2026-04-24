/**
 * Canonical Setlist Archive URL for a tour (new site: `/archive/tours?id=`).
 * Legacy `/old/archive/tours` remains until fully retired.
 */
export function getTourArchiveUrl(tourId: string): string {
  return `/archive/tours?id=${encodeURIComponent(tourId)}`
}
