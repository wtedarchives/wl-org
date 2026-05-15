/**
 * Canonical Setlist Archive URL for a list detail page. Uses query param `id`
 * (`lists.list_id`). Prefer `/archive/lists` and `getListArchiveUrl`.
 */
export function getListArchiveUrl(listId: string): string {
  return `/archive/lists?id=${encodeURIComponent(listId)}`
}
