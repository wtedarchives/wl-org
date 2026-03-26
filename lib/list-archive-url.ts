/**
 * Canonical Setlist Archive URL for a list detail page. Uses query param `id`
 * (`lists.list_id`). Legacy `/archive/lists/:uuid` redirects via
 * `public/_redirects` on Netlify.
 */
export function getListArchiveUrl(listId: string): string {
  return `/archive/lists?id=${encodeURIComponent(listId)}`
}
