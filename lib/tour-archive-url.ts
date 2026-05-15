/**
 * Canonical Setlist Archive URL for a tour (`/archive/tours?id=`).
 */
export function getTourArchiveUrl(tourId: string): string {
  return `/archive/tours?id=${encodeURIComponent(tourId)}`
}
