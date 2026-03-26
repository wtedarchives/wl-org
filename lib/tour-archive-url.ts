/**
 * Canonical Setlist Archive URL for a tour. Uses query param `id` so new tours
 * work without redeploying static export; legacy `/archive/tours/:tour_id` URLs
 * redirect via `public/_redirects` on Netlify.
 */
export function getTourArchiveUrl(tourId: string): string {
  return `/archive/tours?id=${encodeURIComponent(tourId)}`
}
