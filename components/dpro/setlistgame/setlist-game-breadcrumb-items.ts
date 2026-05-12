import {
  WTED_ARCHIVES_BREADCRUMB_ROOT,
  WL_V2_ARCHIVES_BREADCRUMB_ROOT,
  type BreadcrumbItem,
} from "@/components/setlist-breadcrumb-context"
import {
  getSetlistGameArchiveIndexUrl,
  getSetlistGameShowArchiveUrl,
  getSetlistGameTourArchiveUrl,
  type SetlistGameArchiveUrlShell,
} from "@/lib/setlist-game-archive-url"
import { formatSetlistGameDate } from "@/lib/setlist-game-utils"

export function setlistGameArchiveRoot(
  shell: SetlistGameArchiveUrlShell,
): BreadcrumbItem {
  return shell === "legacy" ?
      WTED_ARCHIVES_BREADCRUMB_ROOT
    : WL_V2_ARCHIVES_BREADCRUMB_ROOT
}

export function buildSetlistGameIndexBreadcrumbs(
  shell: SetlistGameArchiveUrlShell,
): BreadcrumbItem[] {
  return [
    setlistGameArchiveRoot(shell),
    { label: "Setlist Game", href: getSetlistGameArchiveIndexUrl(shell) },
  ]
}

export function buildSetlistGameTourBreadcrumbs(
  shell: SetlistGameArchiveUrlShell,
  tourId: string,
  tourLabel: string,
): BreadcrumbItem[] {
  return [
    ...buildSetlistGameIndexBreadcrumbs(shell),
    { label: tourLabel, href: getSetlistGameTourArchiveUrl(tourId, shell) },
  ]
}

/** `show` shape matches setlist game show detail (tour link optional). */
export function buildSetlistGameShowBreadcrumbs(
  shell: SetlistGameArchiveUrlShell,
  showId: string,
  show: {
    show_date: string
    show_venue_location?: string | null
    show_tour?: string | null
    tours?: { tour_id: string } | null
  },
): BreadcrumbItem[] {
  const dateLabel = formatSetlistGameDate(show.show_date)
  const venuePart = show.show_venue_location
    ? ` (${show.show_venue_location})`
    : ""
  const lastLabel = `${dateLabel}${venuePart}`
  const tours = show.tours
  const tourSegment =
    show.show_tour && tours?.tour_id ?
      [
        {
          label: show.show_tour,
          href: getSetlistGameTourArchiveUrl(tours.tour_id, shell),
        } satisfies BreadcrumbItem,
      ]
    : []
  return [
    setlistGameArchiveRoot(shell),
    { label: "Setlist Game", href: getSetlistGameArchiveIndexUrl(shell) },
    ...tourSegment,
    { label: lastLabel, href: getSetlistGameShowArchiveUrl(showId, shell) },
  ]
}
