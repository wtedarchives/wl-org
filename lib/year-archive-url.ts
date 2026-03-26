/**
 * Canonical Setlist Archive URL for a year. Uses query param `id` so new years
 * work without redeploying static export; legacy `/archive/years/:year_id` URLs
 * redirect via `public/_redirects` on Netlify.
 */
export function getYearArchiveUrl(yearId: string): string {
  return `/archive/years?id=${encodeURIComponent(yearId)}`
}
