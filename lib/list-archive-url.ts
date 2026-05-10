/**
 * Canonical Setlist Archive URL for a list detail page. Uses query param `id`
 * (`lists.list_id`). Legacy `/old/archive/lists` redirects to `/archive/lists`
 * on Netlify.
 */
export function getListArchiveUrl(listId: string): string {
  return `/archive/lists?id=${encodeURIComponent(listId)}`
}
