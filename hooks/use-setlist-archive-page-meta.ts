"use client"

import { useEffect } from "react"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getTourArchiveUrl } from "@/lib/tour-archive-url"
import { getYearArchiveUrl } from "@/lib/year-archive-url"
import { formatSetlistDate } from "@/lib/setlist-utils"
import {
  type BreadcrumbItem,
  WTED_ARCHIVES_BREADCRUMB_ROOT,
} from "@/components/setlist-breadcrumb-context"
import type { Show } from "@/types/setlist"

/** Same trail as `/old/archive/setlist` header crumbs; `archivesRoot` chooses legacy vs v2 hub link. */
export function buildSetlistArchiveBreadcrumbItems(
  archivesRoot: BreadcrumbItem,
  show: Show,
  yearId: string,
): BreadcrumbItem[] {
  const dateLabel = formatSetlistDate(show.show_date)
  const tourLabel = show.show_tour ?? "Tour"
  const lastLabel = show.show_venue_location
    ? `${dateLabel} – ${show.show_venue_location}`
    : dateLabel
  return [
    archivesRoot,
    { label: show.show_date.slice(0, 4), href: getYearArchiveUrl(yearId) },
    { label: tourLabel, href: getTourArchiveUrl(show.tour_id) },
    { label: lastLabel, href: getSetlistArchiveUrl(show.show_id) },
  ]
}

export function useSetlistArchiveBreadcrumbs(
  show: Show | null | undefined,
  yearId: string | null,
  setSetlistBreadcrumbs: (items: BreadcrumbItem[] | null) => void,
) {
  useEffect(() => {
    if (!show || !yearId) {
      setSetlistBreadcrumbs(null)
      return
    }
    setSetlistBreadcrumbs(
      buildSetlistArchiveBreadcrumbItems(
        WTED_ARCHIVES_BREADCRUMB_ROOT,
        show,
        yearId,
      ),
    )
    return () => setSetlistBreadcrumbs(null)
  }, [show, yearId, setSetlistBreadcrumbs])
}

export function useSetlistArchiveDocumentTitle(
  show: Show | null | undefined,
  options?: { titleSuffix?: string },
) {
  const titleSuffix = options?.titleSuffix ?? "WysteriaLane.org"

  useEffect(() => {
    if (!show) return
    const datePart = formatSetlistDate(show.show_date)
    const group = show.show_group?.trim() || ""
    const venue = show.show_venue_location?.trim() || ""
    const middle =
      group && venue
        ? ` (${group} - ${venue})`
        : group
          ? ` (${group})`
          : venue
            ? ` (${venue})`
            : ""
    document.title = `${datePart}${middle} – ${titleSuffix}`
    return () => {
      document.title = ""
    }
  }, [show, titleSuffix])
}

export function useSetlistScanDrawerFromNavigation(
  openChangesModal: boolean,
  setlistUrl: string | null | undefined,
  setSetlistScanDrawerOpen: (open: boolean) => void,
) {
  useEffect(() => {
    if (openChangesModal && setlistUrl) {
      setSetlistScanDrawerOpen(true)
    }
  }, [openChangesModal, setlistUrl, setSetlistScanDrawerOpen])
}
