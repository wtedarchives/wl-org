"use client"

import { useCallback, useEffect, useId, useMemo, useState } from "react"
import { notFound } from "next/navigation"

import { useAuth } from "@/components/auth-context"
import { SetlistLoginRequiredDialog } from "@/components/dpro/setlist/setlist-login-required-dialog"
import { SetlistWtedLoginRequiredDialog } from "@/components/dpro/setlist/setlist-wted-login-required-dialog"
import {
  WL_V2_ARCHIVES_BREADCRUMB_ROOT,
} from "@/components/setlist-breadcrumb-context"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { WlHomeV2SetlistJotyModal } from "@/components/wl-home-v2/wl-home-v2-setlist-joty-modal"
import { WlHomeV2SetlistSongModal } from "@/components/wl-home-v2/wl-home-v2-setlist-song-modal"
import { WlHomeV2SetlistPlaceholderView } from "@/components/wl-home-v2/wl-home-v2-setlist-placeholder-view"
import { WlHomeV2SetlistRatingModal } from "@/components/wl-home-v2/wl-home-v2-setlist-rating-modal"
import { WlHomeV2SetlistScanModal } from "@/components/wl-home-v2/wl-home-v2-setlist-scan-modal"
import { WlHomeV2SetlistWtedModal } from "@/components/wl-home-v2/wl-home-v2-setlist-wted-modal"
import {
  buildSetlistArchiveBreadcrumbItems,
  useSetlistArchiveDocumentTitle,
} from "@/hooks/use-setlist-archive-page-meta"
import { useMaxShowCanonId } from "@/hooks/use-max-show-canonid"
import {
  useAttendeeCount,
  useShowPosition,
} from "@/hooks/use-setlist-display"
import { useSetlistAttendance } from "@/hooks/use-setlist-attendance"
import { useSetlistRating } from "@/hooks/use-setlist-rating"
import { useShowPositionInTour } from "@/hooks/use-show-position-in-tour"
import { useSetlistArchiveShowId } from "@/hooks/use-setlist-archive-show-id"
import { useSetlistData, useShowDates, useTours } from "@/hooks/use-setlist-data"
import { useSetlistAdmin } from "@/hooks/use-setlist-admin"
import { useSetlistNavigation } from "@/hooks/use-setlist-navigation"
import { useSetlistReleases } from "@/hooks/use-setlist-releases"
import { useSetlistScan } from "@/hooks/use-setlist-scan"
import { useShowChanges } from "@/hooks/use-setlist-show-changes"
import { useSetlistYearId } from "@/hooks/use-setlist-year-id"
import type { SetlistEntry } from "@/types/setlist"

export function WlHomeV2SetlistPageClient() {
  const { session } = useAuth()
  const { showId, invalidParams } = useSetlistArchiveShowId()
  const { showAdminUi } = useSetlistAdmin(session, showId)
  const { show, setlist, loading, showLengthRank } = useSetlistData(showId)
  const { tours } = useTours()
  const { showDates } = useShowDates(show ?? null, showId)
  const showPosition = useShowPosition(show ?? null, showDates)
  const { handleTourSelect, handleShowSelect } = useSetlistNavigation(
    show ?? null,
  )
  const yearId = useSetlistYearId(show?.show_date)
  const { maxCanonId, loading: maxCanonLoading } = useMaxShowCanonId()
  const showPositionInTour = useShowPositionInTour(
    showId,
    show?.show_tour ?? undefined,
  )

  const jotyHeadingId = useId()
  const songModalHeadingId = useId()
  const songModalTourId = useId()
  const wtedModalHeadingId = useId()
  const ratingModalHeadingId = useId()
  const scanHeadingId = useId()
  const [jotyModalOpen, setJotyModalOpen] = useState(false)
  const [songModalOpen, setSongModalOpen] = useState(false)
  const [songModalEntry, setSongModalEntry] = useState<SetlistEntry | null>(
    null,
  )
  const [wtedModalOpen, setWtedModalOpen] = useState(false)
  const [wtedModalEntry, setWtedModalEntry] = useState<SetlistEntry | null>(
    null,
  )
  const [wtedLoginRequiredOpen, setWtedLoginRequiredOpen] = useState(false)
  const [ratingModalOpen, setRatingModalOpen] = useState(false)
  const [loginRequiredOpen, setLoginRequiredOpen] = useState(false)
  const [jotyYear, setJotyYear] = useState<number | null>(null)
  const [jotyHighlightedEntryId, setJotyHighlightedEntryId] = useState<
    string | null
  >(null)
  const [copiedEntryIds, setCopiedEntryIds] = useState<Set<string>>(new Set())
  const [setlistScanModalOpen, setSetlistScanModalOpen] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  const { changes: showChanges, loading: showChangesLoading } =
    useShowChanges(showId)

  useEffect(() => {
    setHoveredCategory(null)
  }, [showId])
  const { setlistUrl } = useSetlistScan(showId)
  const { releases, releaseToEntriesMap } = useSetlistReleases(showId)
  const fallbackWtedArtwork = releases[0]?.release_artwork ?? null

  const { attendeeCount, setAttendeeCount } = useAttendeeCount(
    showId,
    show ?? null,
  )
  const {
    averageRating,
    reviewCount,
    userRating,
    userReview,
    reviews,
    isLoadingReviews,
    reviewsError,
    submitting,
    submitRating,
    fetchReviews,
    validateReview,
  } = useSetlistRating(showId, session)
  const { attended, toggling, toggle } = useSetlistAttendance(
    showId,
    session,
    setAttendeeCount,
  )

  const onRatingClick = useCallback(() => {
    if (session) setRatingModalOpen(true)
    else setLoginRequiredOpen(true)
  }, [session])

  const handleNumberClick = useCallback(async (entryId: string) => {
    try {
      await navigator.clipboard.writeText(entryId)
      setCopiedEntryIds((prev) => new Set(prev).add(entryId))
      setTimeout(() => {
        setCopiedEntryIds((prev) => {
          const next = new Set(prev)
          next.delete(entryId)
          return next
        })
      }, 2000)
    } catch {
      // ignore
    }
  }, [])

  const onJotyBadgeClick = useCallback(
    (entry: SetlistEntry) => {
      const y = show?.show_date?.slice(0, 4)
      setJotyYear(y ? Number(y) : null)
      setJotyHighlightedEntryId(entry.entry_id)
      setJotyModalOpen(true)
    },
    [show?.show_date],
  )

  const onSongClick = useCallback((entry: SetlistEntry) => {
    setSongModalEntry(entry)
    setSongModalOpen(true)
  }, [])

  const onWtedClick = useCallback(
    (entry: SetlistEntry) => {
      if (!session) {
        setWtedLoginRequiredOpen(true)
        return
      }
      setWtedModalEntry(entry)
      setWtedModalOpen(true)
    },
    [session],
  )

  const closeSongModal = useCallback(() => {
    setSongModalOpen(false)
    setSongModalEntry(null)
  }, [])

  const closeWtedModal = useCallback(() => {
    setWtedModalOpen(false)
    setWtedModalEntry(null)
  }, [])

  useEffect(() => {
    if (!wtedModalOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return
      closeWtedModal()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [wtedModalOpen, closeWtedModal])

  const wtedModalShow = useMemo(
    () => ({
      show_date: show?.show_date ?? "",
      show_venue_location: show?.show_venue_location ?? null,
      show_group: show?.show_group ?? null,
    }),
    [show?.show_date, show?.show_venue_location, show?.show_group],
  )

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

  if (loading) {
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
        showAdminUi={showAdminUi}
        copiedEntryIds={showAdminUi ? copiedEntryIds : undefined}
        onNumberClick={showAdminUi ? handleNumberClick : undefined}
        onJotyBadgeClick={onJotyBadgeClick}
        onSongClick={onSongClick}
        onWtedClick={onWtedClick}
        showPositionInTour={showPositionInTour}
        tourShowNav={showPosition}
        onTourShowSelect={handleShowSelect}
        tours={tours}
        showDates={showDates}
        onTourSelect={handleTourSelect}
        maxShowCanonId={maxCanonId}
        maxShowCanonIdLoading={maxCanonLoading}
        releases={releases}
        releaseToEntriesMap={releaseToEntriesMap}
        averageRating={averageRating}
        reviewCount={reviewCount}
        onRatingClick={onRatingClick}
        attendeeCount={attendeeCount}
        attended={attended}
        attendanceToggling={toggling}
        onAttendanceToggle={toggle}
        canMarkAttendance={!!session}
        showLengthRank={showLengthRank}
        showChanges={showChanges}
        showChangesLoading={showChangesLoading}
        onOpenSetlistScan={
          setlistUrl ? () => setSetlistScanModalOpen(true) : undefined
        }
        hoveredCategory={hoveredCategory}
        onCategoryHover={setHoveredCategory}
      />
      <WlHomeV2SetlistRatingModal
        open={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        headingId={ratingModalHeadingId}
        showDate={show.show_date ?? ""}
        showVenueLocation={show.show_venue_location ?? ""}
        averageRating={averageRating}
        reviewCount={reviewCount}
        userRating={userRating}
        userReview={userReview}
        reviews={reviews}
        isLoadingReviews={isLoadingReviews}
        reviewsError={reviewsError}
        onSubmit={submitRating}
        submitting={submitting}
        onFetchReviews={fetchReviews}
        validateReview={validateReview}
      />
      <SetlistLoginRequiredDialog
        open={loginRequiredOpen}
        onOpenChange={setLoginRequiredOpen}
      />
      <WlHomeV2SetlistJotyModal
        open={jotyModalOpen}
        onClose={() => setJotyModalOpen(false)}
        year={jotyYear}
        highlightedEntryId={jotyHighlightedEntryId}
        headingId={jotyHeadingId}
      />
      <WlHomeV2SetlistSongModal
        open={songModalOpen}
        onClose={closeSongModal}
        entry={songModalEntry}
        tourName={show.show_tour}
        headingId={songModalHeadingId}
        tourLineId={songModalTourId}
      />
      <SetlistWtedLoginRequiredDialog
        open={wtedLoginRequiredOpen}
        onOpenChange={setWtedLoginRequiredOpen}
        wlHomeV2
      />
      <WlHomeV2SetlistWtedModal
        open={wtedModalOpen}
        onClose={closeWtedModal}
        entry={wtedModalEntry}
        setlist={setlist}
        show={wtedModalShow}
        fallbackReleaseArtwork={fallbackWtedArtwork}
        headingId={wtedModalHeadingId}
      />
      <WlHomeV2SetlistScanModal
        open={setlistScanModalOpen}
        onClose={() => setSetlistScanModalOpen(false)}
        headingId={scanHeadingId}
        setlistUrl={setlistUrl ?? ""}
        show={show}
        setlist={setlist}
        changes={showChanges}
      />
    </>
  )
}
