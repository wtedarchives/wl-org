/**
 * Canonical Setlist Archive URL for a song. Uses query param `id` so new songs
 * work without redeploying static export; legacy `/old/archive/song/:song_id` URLs
 * redirect via `public/_redirects` on Netlify.
 */
export function getSongArchiveUrl(songId: string): string {
  return `/old/archive/song?id=${encodeURIComponent(songId)}`
}
