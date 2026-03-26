/**
 * Canonical Setlist Archive URL for a discography release. Uses query param `id`
 * (discography `uuid`). Legacy `/archive/discography/:uuid` redirects via
 * `public/_redirects` on Netlify.
 */
export function getDiscographyArchiveUrl(releaseUuid: string): string {
  return `/archive/discography?id=${encodeURIComponent(releaseUuid)}`
}
