/**
 * Canonical Setlist Archive URL for a song. Uses query param `id` so new songs
 * work without redeploying static export.
 */
export function getSongArchiveUrl(songId: string): string {
  return `/archive/song?id=${encodeURIComponent(songId)}`
}
