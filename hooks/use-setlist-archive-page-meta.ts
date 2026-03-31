"use client"

import { useEffect } from "react"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getTourArchiveUrl } from "@/lib/tour-archive-url"
import { getYearArchiveUrl } from "@/lib/year-archive-url"
import { formatSetlistDate } from "@/lib/setlist-utils"
import type { BreadcrumbItem } from "@/components/setlist-breadcrumb-context"
import type { Show } from "@/types/setlist"

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
    const dateLabel = formatSetlistDate(show.show_date)
    const tourLabel = show.show_tour ?? "Tour"
    const lastLabel = show.show_venue_location
      ? `${dateLabel} – ${show.show_venue_location}`
      : dateLabel
    setSetlistBreadcrumbs([
      { label: "Setlist Archive", href: "/archive" },
      { label: show.show_date.slice(0, 4), href: getYearArchiveUrl(yearId) },
      { label: tourLabel, href: getTourArchiveUrl(show.tour_id) },
      { label: lastLabel, href: getSetlistArchiveUrl(show.show_id) },
    ])
    return () => setSetlistBreadcrumbs(null)
  }, [show, yearId, setSetlistBreadcrumbs])
}

export function useSetlistArchiveDocumentTitle(show: Show | null | undefined) {
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
    document.title = `${datePart}${middle} – WysteriaLane.org`
    return () => {
      document.title = ""
    }
  }, [show])
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
