/**
 * Canonical Setlist Archive URL for a discography release (`/archive/discography?id=`).
 * Uses query param `id` (discography `uuid`).
 */
export function getDiscographyArchiveUrl(releaseUuid: string): string {
  return `/archive/discography?id=${encodeURIComponent(releaseUuid)}`
}
