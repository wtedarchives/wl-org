import type { SiteSearchCategory } from "@/lib/site-search"

/**
 * Canonical Setlist Archive URL for site-wide search results.
 * Query-param based so runtime searches work with static export.
 */
export function getSiteSearchArchiveUrl(
  q: string,
  category?: SiteSearchCategory,
): string {
  const params = new URLSearchParams()
  const trimmed = q.trim()
  if (trimmed) params.set("q", trimmed)
  if (category) params.set("category", category)
  const qs = params.toString()
  return qs ? `/archive/search?${qs}` : "/archive/search"
}
