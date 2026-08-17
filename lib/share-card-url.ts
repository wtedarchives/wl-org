/**
 * Bare setlist-card page for cloud screenshots (`/archive/share-card?id=`).
 * Query `id` matches other archive detail URLs. `notes=0` hides per-song coach notes.
 *
 * The page sets `#share-card-ready` only after fonts and images have painted.
 */

export const SHARE_CARD_READY_SELECTOR = "#share-card-ready"

export type ShareCardUrlOptions = {
  /** When false, omit per-entry coach notes. Default true. */
  showEntryCoachNotes?: boolean
}

export function getShareCardArchiveUrl(
  showId: string,
  options?: ShareCardUrlOptions,
): string {
  const params = new URLSearchParams()
  params.set("id", showId)
  if (options?.showEntryCoachNotes === false) params.set("notes", "0")
  return `/archive/share-card?${params.toString()}`
}

export function resolveShareCardShowId(
  searchParams: Pick<URLSearchParams, "get">,
): string | null {
  const id = (searchParams.get("id") ?? searchParams.get("show") ?? "").trim()
  return id || null
}

export function resolveShareCardShowEntryCoachNotes(
  searchParams: Pick<URLSearchParams, "get">,
): boolean {
  return searchParams.get("notes") !== "0"
}
