"use client"

import { useCallback, useId, useMemo, useState } from "react"
import { notFound } from "next/navigation"

import {
  WL_V2_ARCHIVES_BREADCRUMB_ROOT,
} from "@/components/setlist-breadcrumb-context"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { WlHomeV2SetlistJotyModal } from "@/components/wl-home-v2/wl-home-v2-setlist-joty-modal"
import { WlHomeV2SetlistPlaceholderView } from "@/components/wl-home-v2/wl-home-v2-setlist-placeholder-view"
import {
  buildSetlistArchiveBreadcrumbItems,
  useSetlistArchiveDocumentTitle,
} from "@/hooks/use-setlist-archive-page-meta"
import { useMaxShowCanonId } from "@/hooks/use-max-show-canonid"
import { useShowPosition } from "@/hooks/use-setlist-display"
import { useShowPositionInTour } from "@/hooks/use-show-position-in-tour"
import { useSetlistArchiveShowId } from "@/hooks/use-setlist-archive-show-id"
import { useSetlistData, useShowDates } from "@/hooks/use-setlist-data"
import { useSetlistNavigation } from "@/hooks/use-setlist-navigation"
import { useSetlistYearId } from "@/hooks/use-setlist-year-id"
import type { SetlistEntry } from "@/types/setlist"

export function WlHomeV2SetlistPageClient() {
  const { showId, invalidParams } = useSetlistArchiveShowId()
  const { show, setlist, loading } = useSetlistData(showId)
  const { showDates } = useShowDates(show ?? null, showId)
  const showPosition = useShowPosition(show ?? null, showDates)
  const { handleShowSelect } = useSetlistNavigation(show ?? null)
  const yearId = useSetlistYearId(show?.show_date)
  const { maxCanonId, loading: maxCanonLoading } = useMaxShowCanonId()
  const showPositionInTour = useShowPositionInTour(
    showId,
    show?.show_tour ?? undefined,
  )

  const jotyHeadingId = useId()
  const [jotyModalOpen, setJotyModalOpen] = useState(false)
  const [jotyYear, setJotyYear] = useState<number | null>(null)
  const [jotyHighlightedEntryId, setJotyHighlightedEntryId] = useState<
    string | null
  >(null)

  const onJotyBadgeClick = useCallback(
    (entry: SetlistEntry) => {
      const y = show?.show_date?.slice(0, 4)
      setJotyYear(y ? Number(y) : null)
      setJotyHighlightedEntryId(entry.entry_id)
      setJotyModalOpen(true)
    },
    [show?.show_date],
  )

  useSetlistArchiveDocumentTitle(show, { titleSuffix: "WTED.org" })

  const breadcrumbs = useMemo(
    () =>
      show && yearId ?
        buildSetlistArchiveBreadcrumbItems(
          WL_V2_ARCHIVES_BREADCRUMB_ROOT,
          show,
          yearId,
        )
      : null,
    [show, yearId],
  )

  if (invalidParams || !showId) notFound()

  if (loading) {
    return <WlHomeV2PageLoading message="Loading setlist…" />
  }

  if (!show) notFound()

  return (
    <>
      <WlHomeV2SetlistPlaceholderView
        breadcrumbs={breadcrumbs}
        show={show}
        setlist={setlist}
        onJotyBadgeClick={onJotyBadgeClick}
        showPositionInTour={showPositionInTour}
        tourShowNav={showPosition}
        onTourShowSelect={handleShowSelect}
        maxShowCanonId={maxCanonId}
        maxShowCanonIdLoading={maxCanonLoading}
      />
      <WlHomeV2SetlistJotyModal
        open={jotyModalOpen}
        onClose={() => setJotyModalOpen(false)}
        year={jotyYear}
        highlightedEntryId={jotyHighlightedEntryId}
        headingId={jotyHeadingId}
      />
    </>
  )
}
