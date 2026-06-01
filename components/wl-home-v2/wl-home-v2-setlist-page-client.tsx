"use client"

import { notFound } from "next/navigation"

import {
  WL_V2_ARCHIVES_BREADCRUMB_ROOT,
} from "@/components/setlist-breadcrumb-context"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { WlHomeV2SetlistPageModals } from "@/components/wl-home-v2/wl-home-v2-setlist-page-modals"
import { WlHomeV2SetlistPlaceholderView } from "@/components/wl-home-v2/wl-home-v2-setlist-placeholder-view"
import {
  buildSetlistArchiveBreadcrumbItems,
  useSetlistArchiveDocumentTitle,
} from "@/hooks/use-setlist-archive-page-meta"
import { useWlHomeV2SetlistPageClient } from "@/hooks/use-wl-home-v2-setlist-page-client"
import { useMemo } from "react"

export function WlHomeV2SetlistPageClient() {
  const state = useWlHomeV2SetlistPageClient()
  const {
    invalidParams,
    showId,
    show,
    setlist,
    loading,
    songPairsLoading,
    songPairs,
    yearId,
  } = state

  useSetlistArchiveDocumentTitle(show)

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

  if (loading || songPairsLoading) {
    return <WlHomeV2PageLoading message="Loading setlist…" />
  }

  if (!show) notFound()

  return (
    <>
      <WlHomeV2SetlistPlaceholderView
        breadcrumbs={breadcrumbs}
        show={show}
        showId={showId}
        setlist={setlist}
        songPairs={songPairs}
        showAdminUi={state.showAdminUi}
        adminLinkCopied={state.showAdminUi ? state.linkCopied : false}
        onAdminCopyShowId={state.showAdminUi ? state.handleCopyLink : undefined}
        onAdminEditShow={state.showAdminUi ? state.handleEditShow : undefined}
        onShareSetlistImage={state.showAdminUi ? state.openShareExport : undefined}
        copiedEntryIds={state.showAdminUi ? state.copiedEntryIds : undefined}
        onNumberClick={state.showAdminUi ? state.handleNumberClick : undefined}
        onJotyBadgeClick={state.onJotyBadgeClick}
        onSongClick={state.onSongClick}
        onPairSongClick={state.onPairSongClick}
        onWtedClick={state.onWtedClick}
        onPairWtedClick={state.onPairWtedClick}
        showPositionInTour={state.showPositionInTour}
        tourShowNav={state.showPosition}
        onTourShowSelect={state.handleShowSelect}
        tours={state.tours}
        showDates={state.showDates}
        onTourSelect={state.handleTourSelect}
        maxShowCanonId={state.maxCanonId}
        maxShowCanonIdLoading={state.maxCanonLoading}
        releases={state.releases}
        releaseToEntriesMap={state.releaseToEntriesMap}
        averageRating={state.averageRating}
        reviewCount={state.reviewCount}
        onRatingClick={state.onRatingClick}
        attendeeCount={state.attendeeCount}
        attended={state.attended}
        attendanceToggling={state.toggling}
        onAttendanceToggle={state.onAttendanceClick}
        showLengthRank={state.showLengthRank}
        showChanges={state.showChanges}
        showChangesLoading={state.showChangesLoading}
        onOpenSetlistScan={
          state.setlistUrl ? () => state.setSetlistScanModalOpen(true) : undefined
        }
        hoveredCategory={state.hoveredCategory}
        onCategoryHover={state.setHoveredCategory}
      />
      <WlHomeV2SetlistPageModals
        show={show}
        setlist={setlist}
        showChanges={state.showChanges}
        state={state}
      />
    </>
  )
}
