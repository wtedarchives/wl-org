/**
 * Canonical Setlist Archive URL for a year (new site: `/archive/years?id=`).
 * Legacy `/old/archive/years` remains a separate route until fully retired.
 */
export function getYearArchiveUrl(yearId: string): string {
  return `/archive/years?id=${encodeURIComponent(yearId)}`
}
