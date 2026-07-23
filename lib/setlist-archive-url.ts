/**
 * Canonical Setlist Archive URL for a show. Uses query param `id` so new shows
 * work without redeploying static export; old `/old/archive/setlist/:id` and
 * `?show_id=` URLs are redirected or normalized via `public/_redirects` and the
 * setlist page client.
 */

export type SetlistArchiveUrlOptions = {
  /** Open the setlist scan modal on load (`?scan=1`). */
  scan?: boolean
  /** Open the poster modal on load (`?poster=1`). */
  poster?: boolean
}

export function getSetlistArchiveUrl(
  showId: string,
  options?: SetlistArchiveUrlOptions,
): string {
  const params = new URLSearchParams()
  params.set("id", showId)
  if (options?.scan) params.set("scan", "1")
  if (options?.poster) params.set("poster", "1")
  return `/archive/setlist?${params.toString()}`
}

/** True when the URL requests the setlist scan modal. */
export function setlistUrlRequestsScan(
  searchParams: Pick<URLSearchParams, "get" | "has">,
): boolean {
  return (
    searchParams.get("scan") === "1" || searchParams.has("openChangesModal")
  )
}

/** True when the URL requests the poster modal. */
export function setlistUrlRequestsPoster(
  searchParams: Pick<URLSearchParams, "get">,
): boolean {
  return searchParams.get("poster") === "1"
}

/** Drop scan/poster deep-link flags while keeping `id` and other params. */
export function stripSetlistModalQueryParams(
  searchParams: URLSearchParams,
  which: { scan?: boolean; poster?: boolean },
): URLSearchParams {
  const next = new URLSearchParams(searchParams.toString())
  if (which.scan) {
    next.delete("scan")
    next.delete("openChangesModal")
  }
  if (which.poster) {
    next.delete("poster")
  }
  return next
}
