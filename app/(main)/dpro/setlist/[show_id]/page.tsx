"use client"

import { use, useEffect, useRef, useState } from "react"
import { notFound } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useSetlistBreadcrumb } from "@/components/setlist-breadcrumb-context"
import { useAuth } from "@/components/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import type { Show } from "@/types/setlist"
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
import { SetlistSidebar } from "@/components/dpro/setlist/setlist-sidebar"
import { SetlistShowStatsCard } from "@/components/dpro/setlist/setlist-show-stats-card"
import { SetlistShowChangesCard } from "@/components/dpro/setlist/setlist-show-changes-card"
import { SetlistBadgesCard } from "@/components/dpro/setlist/setlist-badges-card"
import { SetlistSongSpreadCard } from "@/components/dpro/setlist/setlist-song-spread-card"
import { SetlistCallbacks } from "@/components/dpro/setlist/setlist-callbacks"
import { SetlistShowNotes } from "@/components/dpro/setlist/setlist-show-notes"
import { SetlistPageHeader } from "@/components/dpro/setlist/setlist-page-header"
import { SetlistTourDropdown } from "@/components/dpro/setlist/setlist-tour-dropdown"
import { SetlistShowsDropdown } from "@/components/dpro/setlist/setlist-shows-dropdown"
import { SetlistRatingCard } from "@/components/dpro/setlist/setlist-rating-card"
import { SetlistAttendanceCard } from "@/components/dpro/setlist/setlist-attendance-card"
import { SetlistRatingDrawer } from "@/components/dpro/setlist/setlist-rating-drawer"
import { SetlistLoginRequiredDialog } from "@/components/dpro/setlist/setlist-login-required-dialog"
import { SetlistScanDrawer } from "@/components/dpro/setlist/setlist-scan-drawer"
import { SetlistMediaSection } from "@/components/dpro/setlist/setlist-media-section"
import { SetlistSongPerformancesSheet } from "@/components/dpro/setlist/setlist-song-performances-sheet"
import { SetlistJotyDrawer } from "@/components/dpro/setlist/setlist-joty-drawer"
import {
  SetlistWtedSheet,
  getWtedRateLimited,
} from "@/components/dpro/setlist/setlist-wted-sheet"
import { useSetlistRating } from "@/hooks/use-setlist-rating"
import { useSetlistAttendance } from "@/hooks/use-setlist-attendance"
import type { SetlistEntry } from "@/types/setlist"

const DESKTOP_MIN_WIDTH = 1280

export default function SetlistPage({
  params,
}: {
  params: Promise<{ show_id: string }>
}) {
  const { show_id: showId } = use(params)
  const containerRef = useRef<HTMLDivElement>(null)
  const [layoutMode, setLayoutMode] = useState<"mobile" | "desktop">("desktop")

  const { show, setlist, loading, showLengthRank } = useSetlistData(showId)
  const { tours } = useTours()
  const { showDates } = useShowDates(show ?? null, showId)
  const showPosition = useShowPosition(show ?? null, showDates)
  const { attendeeCount, setAttendeeCount } = useAttendeeCount(showId, show ?? null)
  const showPositionInTour = useShowPositionInTour(showId, show?.show_tour ?? undefined)
  const yearId = useSetlistYearId(show?.show_date)
  const {
    handleTourSelect,
    handleShowSelect,
    openChangesModal,
    setOpenChangesModal,
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
    loading: releasesLoading,
  } = useSetlistReleases(showId)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [hoveredReleaseId, setHoveredReleaseId] = useState<string | null>(null)

  useEffect(() => {
    setHoveredReleaseId(null)
  }, [showId])
  const [ratingDrawerOpen, setRatingDrawerOpen] = useState(false)
  const [loginRequiredOpen, setLoginRequiredOpen] = useState(false)
  const [songSheetOpen, setSongSheetOpen] = useState(false)
  const [songSheetEntry, setSongSheetEntry] = useState<SetlistEntry | null>(null)
  const [jotyDrawerOpen, setJotyDrawerOpen] = useState(false)
  const [jotyDrawerYear, setJotyDrawerYear] = useState<number | null>(null)
  const [jotyDrawerHighlightedEntryId, setJotyDrawerHighlightedEntryId] =
    useState<string | null>(null)
  const [wtedSheetOpen, setWtedSheetOpen] = useState(false)
  const [wtedSheetEntry, setWtedSheetEntry] = useState<SetlistEntry | null>(null)
  const [setlistScanDrawerOpen, setSetlistScanDrawerOpen] = useState(false)
  const [copiedEntryIds, setCopiedEntryIds] = useState<Set<string>>(new Set())

  const handleNumberClick = async (entryId: string) => {
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
      // ignore clipboard errors
    }
  }

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
    setAttendeeCount
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () =>
      setLayoutMode(el.clientWidth >= DESKTOP_MIN_WIDTH ? "desktop" : "mobile")
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

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
      { label: "Setlist Archive", href: "/dpro" },
      { label: show.show_date.slice(0, 4), href: `/dpro/years/${yearId}` },
      { label: tourLabel, href: `/dpro/tours/${show.tour_id}` },
      { label: lastLabel, href: "" },
    ])
    return () => setSetlistBreadcrumbs(null)
  }, [show, yearId, setSetlistBreadcrumbs])

  useEffect(() => {
    if (openChangesModal && setlistUrl) {
      setSetlistScanDrawerOpen(true)
    }
  }, [openChangesModal, setlistUrl])

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
    document.title = `${datePart}${middle} – Wysteria Lane`
    return () => { document.title = "" }
  }, [show])

  if (!showId) notFound()
  if (!loading && !show) notFound()

  if (loading) {
    return (
      <div
        ref={containerRef}
        className="flex min-w-0 flex-1 flex-col gap-4 rounded-b-none p-4 md:rounded-b-xl md:p-6"
      >
        <Card className="border-border/60 bg-card/80 py-0">
          <CardContent className="flex items-center justify-center gap-2 py-12">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Loading setlist…
            </span>
          </CardContent>
        </Card>
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

      {/* Main + Sidebar */}
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
                        : null
                    )
                    setJotyDrawerHighlightedEntryId(entry.entry_id)
                    setJotyDrawerOpen(true)
                  }}
                  onWtedClick={(entry) => {
                    if (getWtedRateLimited()) return
                    setWtedSheetEntry(entry)
                    setWtedSheetOpen(true)
                  }}
                  copiedEntryIds={showAdminUi ? copiedEntryIds : undefined}
                  onNumberClick={showAdminUi ? handleNumberClick : undefined}
                  showAdminUi={showAdminUi}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/60 bg-card/80 py-0">
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                No setlist data for this show.
              </CardContent>
            </Card>
          )}
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

      <SetlistRatingDrawer
        open={ratingDrawerOpen}
        onOpenChange={setRatingDrawerOpen}
        showDate={show?.show_date ?? ""}
        showVenueLocation={show?.show_venue_location ?? ""}
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

      {setlistUrl && (
        <SetlistScanDrawer
          open={setlistScanDrawerOpen}
          onOpenChange={setSetlistScanDrawerOpen}
          setlistUrl={setlistUrl}
          show={show}
          setlist={setlist}
          changes={changes}
        />
      )}

      <SetlistSongPerformancesSheet
        open={songSheetOpen}
        onOpenChange={setSongSheetOpen}
        entry={songSheetEntry}
        tourName={show.show_tour}
      />

      <SetlistJotyDrawer
        open={jotyDrawerOpen}
        onOpenChange={setJotyDrawerOpen}
        year={jotyDrawerYear}
        highlightedEntryId={jotyDrawerHighlightedEntryId}
      />

      <SetlistWtedSheet
        open={wtedSheetOpen}
        onOpenChange={setWtedSheetOpen}
        entry={wtedSheetEntry}
      />
    </div>
  )
}
