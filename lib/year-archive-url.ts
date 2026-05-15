/**
 * Canonical Setlist Archive URL for a year (`/archive/years?id=`).
 */
export function getYearArchiveUrl(yearId: string): string {
  return `/archive/years?id=${encodeURIComponent(yearId)}`
}
