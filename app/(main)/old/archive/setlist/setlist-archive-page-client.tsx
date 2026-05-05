"use client"

import { notFound } from "next/navigation"
import { useSetlistBreadcrumb } from "@/components/setlist-breadcrumb-context"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { useAuth } from "@/components/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { formatSetlistDate, totalSetlistLength } from "@/lib/setlist-utils"
import { useSetlistData, useTours, useShowDates } from "@/hooks/use-setlist-data"
import { useSetlistNavigation } from "@/hooks/use-setlist-navigation"
import {
  useShowPosition,
  useAttendeeCount,
  useGuestGroups,
} from "@/hooks/use-setlist-display"
import { DisplaySetlistTable } from "@/components/dpro/setlist/display-setlist-table"
import { useShowPositionInTour } from "@/hooks/use-show-position-in-tour"
import { useSetlistAdmin } from "@/hooks/use-setlist-admin"
import { useSetlistYearId } from "@/hooks/use-setlist-year-id"
import { useShowChanges } from "@/hooks/use-setlist-show-changes"
import { useSetlistScan } from "@/hooks/use-setlist-scan"
import { useSetlistReleases } from "@/hooks/use-setlist-releases"
import { useSetlistPageState } from "@/hooks/use-setlist-page-state"
import { SetlistSidebar } from "@/components/dpro/setlist/setlist-sidebar"
import { SetlistShowStatsCard } from "@/components/dpro/setlist/setlist-show-stats-card"
import { SetlistShowChangesCard } from "@/components/dpro/setlist/setlist-show-changes-card"
import { SetlistBadgesCard } from "@/components/dpro/setlist/setlist-badges-card"
import { SetlistSongSpreadCard } from "@/components/dpro/setlist/setlist-song-spread-card"
import { SetlistCallbacks } from "@/components/dpro/setlist/setlist-callbacks"
import { SetlistShowNotes } from "@/components/dpro/setlist/setlist-show-notes"
import { SetlistPageHeader } from "@/components/dpro/setlist/setlist-page-header"
import { SetlistRatingCard } from "@/components/dpro/setlist/setlist-rating-card"
import { SetlistAttendanceCard } from "@/components/dpro/setlist/setlist-attendance-card"
import { SetlistCommunityForumButton } from "@/components/dpro/setlist/setlist-community-forum-button"
import { SetlistMediaSection } from "@/components/dpro/setlist/setlist-media-section"
import { SetlistPageDrawers } from "@/components/dpro/setlist/setlist-page-drawers"
import { SetlistEgnAttribution } from "@/components/dpro/setlist/setlist-egn-attribution"
import { useSetlistRating } from "@/hooks/use-setlist-rating"
import { useSetlistAttendance } from "@/hooks/use-setlist-attendance"
import { useSetlistArchiveShowId } from "@/hooks/use-setlist-archive-show-id"
import {
  useSetlistArchiveBreadcrumbs,
  useSetlistArchiveDocumentTitle,
  useSetlistScanDrawerFromNavigation,
} from "@/hooks/use-setlist-archive-page-meta"

export default function SetlistArchivePageClient() {
  const { showId, invalidParams } = useSetlistArchiveShowId()

  const pageState = useSetlistPageState(showId)
  const {
    containerRef,
    layoutMode,
    hoveredCategory,
    setHoveredCategory,
    hoveredReleaseId,
    setHoveredReleaseId,
    ratingDrawerOpen,
    setRatingDrawerOpen,
    loginRequiredOpen,
    setLoginRequiredOpen,
    wtedLoginRequiredOpen,
    setWtedLoginRequiredOpen,
    songSheetOpen,
    setSongSheetOpen,
    songSheetEntry,
    setSongSheetEntry,
    jotyDrawerOpen,
    setJotyDrawerOpen,
    jotyDrawerYear,
    setJotyDrawerYear,
    jotyDrawerHighlightedEntryId,
    setJotyDrawerHighlightedEntryId,
    wtedSheetOpen,
    setWtedSheetOpen,
    wtedSheetEntry,
    setWtedSheetEntry,
    setlistScanDrawerOpen,
    setSetlistScanDrawerOpen,
    copiedEntryIds,
    handleNumberClick,
  } = pageState

  const { show, setlist, loading, showLengthRank, progress } =
    useSetlistData(showId)
  const { tours } = useTours()
  const { showDates } = useShowDates(show ?? null, showId)
  const showPosition = useShowPosition(show ?? null, showDates)
  const { attendeeCount, setAttendeeCount } = useAttendeeCount(
    showId,
    show ?? null,
  )
  const showPositionInTour = useShowPositionInTour(
    showId,
    show?.show_tour ?? undefined,
  )
  const yearId = useSetlistYearId(show?.show_date)
  const {
    handleTourSelect,
    handleShowSelect,
    openChangesModal,
  } = useSetlistNavigation(show ?? null)
  const guestGroups = useGuestGroups(setlist)
  const { user } = useAuth()
  const {
    showAdminUi,
    linkCopied,
    handleCopyLink,
    handleEditShow,
  } = useSetlistAdmin(user, showId)
  const { setSetlistBreadcrumbs } = useSetlistBreadcrumb()
  const { changes, loading: changesLoading } = useShowChanges(showId)
  const { setlistUrl } = useSetlistScan(showId)
  const {
    releases,
    releaseToEntriesMap,
    hasReleases,
  } = useSetlistReleases(showId)

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
  } = useSetlistRating(showId, user ?? null)
  const { attended, toggling, toggle } = useSetlistAttendance(
    showId,
    user ?? null,
    setAttendeeCount,
  )

  useSetlistArchiveBreadcrumbs(show, yearId, setSetlistBreadcrumbs)
  useSetlistArchiveDocumentTitle(show)
  useSetlistScanDrawerFromNavigation(
    openChangesModal,
    setlistUrl,
    setSetlistScanDrawerOpen,
  )

  if (invalidParams) notFound()
  if (!showId) notFound()
  if (!loading && !show) notFound()

  if (loading) {
    const setlistMessage = show?.show_date
      ? `Loading ${formatSetlistDate(show.show_date)}…`
      : undefined
    return (
      <div ref={containerRef}>
        <LoadingPageCard
          message={setlistMessage}
          page="setlist"
          progress={progress}
        />
      </div>
    )
  }

  if (!show) return null

  return (
    <div
      ref={containerRef}
      className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden rounded-b-none p-4 md:rounded-b-xl md:p-6"
    >
      <SetlistPageHeader
        show={show}
        showId={showId}
        showDates={showDates}
        showPosition={showPosition}
        showPositionInTour={showPositionInTour ?? null}
        tours={tours}
        onTourSelect={handleTourSelect}
        onShowSelect={handleShowSelect}
        showAdminUi={showAdminUi}
        linkCopied={linkCopied}
        onCopyLink={handleCopyLink}
        onEditShow={handleEditShow}
      />

      <div
        className={`flex min-w-0 gap-4 ${layoutMode === "desktop" ? "flex-row" : "flex-col"}`}
      >
        <div className="min-w-0 flex-1 space-y-4">
          {layoutMode === "mobile" && (
            <div className="flex flex-row flex-wrap gap-3">
              <div className="min-w-0 flex-1">
                <SetlistRatingCard
                  averageRating={averageRating}
                  reviewCount={reviewCount}
                  onClick={() =>
                    user ? setRatingDrawerOpen(true) : setLoginRequiredOpen(true)
                  }
                />
              </div>
              <div className="min-w-0 flex-1">
                <SetlistAttendanceCard
                  attendeeCount={attendeeCount}
                  attended={attended}
                  toggling={toggling}
                  onToggle={toggle}
                  showAttendButton={!!user}
                />
              </div>
            </div>
          )}
          {layoutMode === "mobile" && (
            <SetlistCommunityForumButton href={show.show_wl_link} />
          )}

          <SetlistShowNotes notes={show.show_coachnotes} />
          {setlist.length > 0 ? (
            <Card className="border-border/60 bg-card/80 py-0">
              <CardContent className="p-0">
                <DisplaySetlistTable
                  setlist={setlist}
                  guestGroups={guestGroups}
                  showCanonColumns={show.show_canonid != null}
                  showWtedColumn={setlist.some((e) => !!e.radio_id)}
                  hoveredCategory={hoveredCategory}
                  hoveredReleaseId={hoveredReleaseId}
                  releaseToEntriesMap={releaseToEntriesMap}
                  onSongClick={(entry) => {
                    setSongSheetEntry(entry)
                    setSongSheetOpen(true)
                  }}
                  onJotyClick={(entry) => {
                    setJotyDrawerYear(
                      show?.show_date
                        ? new Date(show.show_date).getFullYear()
                        : null,
                    )
                    setJotyDrawerHighlightedEntryId(entry.entry_id)
                    setJotyDrawerOpen(true)
                  }}
                  onWtedClick={(entry) => {
                    if (!user) {
                      setWtedLoginRequiredOpen(true)
                      return
                    }
                    setWtedSheetEntry(entry)
                    setWtedSheetOpen(true)
                  }}
                  copiedEntryIds={showAdminUi ? copiedEntryIds : undefined}
                  onNumberClick={showAdminUi ? handleNumberClick : undefined}
                  showAdminUi={showAdminUi}
                />
              </CardContent>
            </Card>
          ) : null}
          {layoutMode === "mobile" && (
            <SetlistShowStatsCard
              show={show}
              totalLengthFromSetlist={totalSetlistLength(setlist) || null}
              showLengthRank={showLengthRank}
            />
          )}
          <SetlistCallbacks callbacks={show.show_callbacks} />
          {layoutMode === "mobile" && (
            <>
              {setlistUrl && (
                <SetlistShowChangesCard
                  changes={changes}
                  loading={changesLoading}
                  onOpenModal={() => setSetlistScanDrawerOpen(true)}
                />
              )}
              <SetlistBadgesCard show={show} />
              <SetlistSongSpreadCard
                setlist={setlist}
                hoveredCategory={hoveredCategory}
                onCategoryHover={setHoveredCategory}
              />
            </>
          )}
          {hasReleases && (
            <SetlistMediaSection
              releases={releases}
              onReleaseHover={setHoveredReleaseId}
            />
          )}
        </div>

        {layoutMode === "desktop" && (
          <div className="flex w-[280px] shrink-0 flex-col gap-3">
            <div className="flex flex-row gap-3">
              <div className="min-w-0 flex-1">
                <SetlistRatingCard
                  averageRating={averageRating}
                  reviewCount={reviewCount}
                  onClick={() =>
                    user ? setRatingDrawerOpen(true) : setLoginRequiredOpen(true)
                  }
                />
              </div>
              <div className="min-w-0 flex-1">
                <SetlistAttendanceCard
                  attendeeCount={attendeeCount}
                  attended={attended}
                  toggling={toggling}
                  onToggle={toggle}
                  showAttendButton={!!user}
                />
              </div>
            </div>
            <SetlistCommunityForumButton href={show.show_wl_link} />
            <SetlistSidebar
              show={show}
              setlist={setlist}
              showLengthRank={showLengthRank}
              changes={changes}
              changesLoading={changesLoading}
              hasSetlistScan={!!setlistUrl}
              onOpenSetlistScan={() => setSetlistScanDrawerOpen(true)}
              hoveredCategory={hoveredCategory}
              onCategoryHover={setHoveredCategory}
            />
          </div>
        )}
      </div>

      {show.egn_sourced === true ? <SetlistEgnAttribution /> : null}

      <SetlistPageDrawers
        show={show}
        setlist={setlist}
        changes={changes}
        setlistUrl={setlistUrl}
        ratingDrawerOpen={ratingDrawerOpen}
        setRatingDrawerOpen={setRatingDrawerOpen}
        loginRequiredOpen={loginRequiredOpen}
        setLoginRequiredOpen={setLoginRequiredOpen}
        wtedLoginRequiredOpen={wtedLoginRequiredOpen}
        setWtedLoginRequiredOpen={setWtedLoginRequiredOpen}
        songSheetOpen={songSheetOpen}
        setSongSheetOpen={setSongSheetOpen}
        songSheetEntry={songSheetEntry}
        setSongSheetEntry={setSongSheetEntry}
        jotyDrawerOpen={jotyDrawerOpen}
        setJotyDrawerOpen={setJotyDrawerOpen}
        jotyDrawerYear={jotyDrawerYear}
        jotyDrawerHighlightedEntryId={jotyDrawerHighlightedEntryId}
        wtedSheetOpen={wtedSheetOpen}
        setWtedSheetOpen={setWtedSheetOpen}
        wtedSheetEntry={wtedSheetEntry}
        setWtedSheetEntry={setWtedSheetEntry}
        setlistScanDrawerOpen={setlistScanDrawerOpen}
        setSetlistScanDrawerOpen={setSetlistScanDrawerOpen}
        averageRating={averageRating}
        reviewCount={reviewCount}
        userRating={userRating}
        userReview={userReview}
        reviews={reviews}
        isLoadingReviews={isLoadingReviews}
        reviewsError={reviewsError}
        submitRating={(r: number, rev?: string) => submitRating(r, rev ?? "")}
        submitting={submitting}
        fetchReviews={fetchReviews}
        validateReview={validateReview}
        releases={releases}
      />
    </div>
  )
}
