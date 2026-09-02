/**
 * Canonical Setlist Archive URL for Echo of a Show.
 * Tabs: `/archive/echo?p=tour|show|tours|profile`.
 * Live show: `/archive/echo?p=show&id={show_id}`.
 */

export const ECHO_ARCHIVE_PAGE_PARAM = "p"
export const ECHO_ARCHIVE_SHOW_ID_PARAM = "id"
export const ECHO_ARCHIVE_SHOW_ID_LEGACY_PARAM = "show_id"
export const ECHO_ARCHIVE_TOUR_ID_PARAM = "tour_id"

export const ECHO_ARCHIVE_PAGES = [
  "tour",
  "show",
  "tours",
  "profile",
] as const

export type EchoArchivePage = (typeof ECHO_ARCHIVE_PAGES)[number]

export type EchoArchiveUrlOptions = {
  showId?: string | null
  tourId?: string | null
}

export function isEchoArchivePage(
  value: string | null | undefined,
): value is EchoArchivePage {
  return (ECHO_ARCHIVE_PAGES as readonly string[]).includes(value ?? "")
}

export function parseEchoArchivePage(
  value: string | null | undefined,
): EchoArchivePage {
  return isEchoArchivePage(value) ? value : "tour"
}

export function parseEchoArchiveShowId(
  search: Pick<URLSearchParams, "get">,
): string | null {
  const id = search.get(ECHO_ARCHIVE_SHOW_ID_PARAM)?.trim()
  if (id) return id
  const legacy = search.get(ECHO_ARCHIVE_SHOW_ID_LEGACY_PARAM)?.trim()
  return legacy || null
}

export function parseEchoArchiveTourId(
  search: Pick<URLSearchParams, "get">,
): string | null {
  const id = search.get(ECHO_ARCHIVE_TOUR_ID_PARAM)?.trim()
  return id || null
}

export function getEchoArchiveUrl(
  page: EchoArchivePage = "tour",
  currentSearch?: URLSearchParams | string,
  options?: EchoArchiveUrlOptions,
): string {
  const query = new URLSearchParams(
    typeof currentSearch === "string" ?
      currentSearch
    : currentSearch?.toString() ?? "",
  )
  const fromOptions = options?.showId?.trim() || ""
  const fromSearch = parseEchoArchiveShowId(query)
  const tourId = options?.tourId?.trim() || ""

  query.set(ECHO_ARCHIVE_PAGE_PARAM, page)
  query.delete(ECHO_ARCHIVE_SHOW_ID_PARAM)
  query.delete(ECHO_ARCHIVE_SHOW_ID_LEGACY_PARAM)
  query.delete(ECHO_ARCHIVE_TOUR_ID_PARAM)

  if (page === "show") {
    const showId = fromOptions || fromSearch
    if (showId) query.set(ECHO_ARCHIVE_SHOW_ID_PARAM, showId)
  }

  if (page === "tours" && tourId) {
    query.set(ECHO_ARCHIVE_TOUR_ID_PARAM, tourId)
  }

  return `/archive/echo?${query.toString()}`
}

/** Live show deep link. `/archive/echo?p=show&id={showId}` */
export function getEchoLiveShowUrl(showId: string): string {
  return getEchoArchiveUrl("show", undefined, { showId })
}

/** Echo history list. `/archive/echo?p=tours` */
export function getEchoHistoryUrl(): string {
  return getEchoArchiveUrl("tours")
}

/** Past tour detail in Echo. `/archive/echo?p=tours&tour_id={tourId}` */
export function getEchoPastTourUrl(tourId: string): string {
  return getEchoArchiveUrl("tours", undefined, { tourId })
}

/** Echo hub root. Defaults to the Tour tab (`?p=tour`). */
export function getEchoArchiveIndexUrl(): string {
  return getEchoArchiveUrl("tour")
}

/** Legacy `/archive/setlistgame` and `/archive/setlistgame2` query shapes → Echo. */
export function getEchoRedirectFromLegacySetlistGameSearch(
  search: Pick<URLSearchParams, "get">,
): string {
  const showId = search.get("id")?.trim()
  const tourId = search.get("tour_id")?.trim()
  if (showId && tourId) return getEchoArchiveIndexUrl()
  if (showId) return getEchoLiveShowUrl(showId)
  if (tourId) return getEchoPastTourUrl(tourId)
  return getEchoArchiveIndexUrl()
}
