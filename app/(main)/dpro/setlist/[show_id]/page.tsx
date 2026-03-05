"use client"

import { use, useEffect, useRef, useState } from "react"
import { notFound } from "next/navigation"
import { Loader2, ListFilter, X } from "lucide-react"
import { useSetlistBreadcrumb } from "@/components/setlist-breadcrumb-context"
import { useAuth } from "@/components/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import type { Show } from "@/types/setlist"
import { formatSetlistDate } from "@/lib/setlist-utils"
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
import { useSetlistReleases } from "@/hooks/use-setlist-releases"
import { SetlistSidebar } from "@/components/dpro/setlist/setlist-sidebar"
import { SetlistCallbacks } from "@/components/dpro/setlist/setlist-callbacks"
import { SetlistShowNotes } from "@/components/dpro/setlist/setlist-show-notes"
import { SetlistPageHeader } from "@/components/dpro/setlist/setlist-page-header"
import { SetlistTourDropdown } from "@/components/dpro/setlist/setlist-tour-dropdown"
import { SetlistShowsDropdown } from "@/components/dpro/setlist/setlist-shows-dropdown"
import { SetlistStarRating } from "@/components/dpro/setlist/setlist-star-rating"
import { SetlistRatingSheet } from "@/components/dpro/setlist/setlist-rating-sheet"
import { SetlistAttendButton } from "@/components/dpro/setlist/setlist-attend-button"
import { SetlistShowChangesSheet } from "@/components/dpro/setlist/setlist-show-changes-sheet"
import { SetlistSongPerformancesSheet } from "@/components/dpro/setlist/setlist-song-performances-sheet"
import { SetlistJotySheet } from "@/components/dpro/setlist/setlist-joty-sheet"
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
  const { releases, hasReleases, loading: releasesLoading } = useSetlistReleases(showId)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [sidebarSheetOpen, setSidebarSheetOpen] = useState(false)
  const [ratingSheetOpen, setRatingSheetOpen] = useState(false)
  const [songSheetOpen, setSongSheetOpen] = useState(false)
  const [songSheetEntry, setSongSheetEntry] = useState<SetlistEntry | null>(null)
  const [jotySheetOpen, setJotySheetOpen] = useState(false)
  const [jotySheetEntry, setJotySheetEntry] = useState<SetlistEntry | null>(null)
  const [wtedSheetOpen, setWtedSheetOpen] = useState(false)
  const [wtedSheetEntry, setWtedSheetEntry] = useState<SetlistEntry | null>(null)
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
    userRating,
    userReview,
    submitting,
    submitRating,
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
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setSidebarSheetOpen(true)}
              >
                <ListFilter className="size-3.5" />
                Stats &amp; more
              </Button>
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
                  onSongClick={(entry) => {
                    setSongSheetEntry(entry)
                    setSongSheetOpen(true)
                  }}
                  onJotyClick={(entry) => {
                    setJotySheetEntry(entry)
                    setJotySheetOpen(true)
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
          <SetlistCallbacks callbacks={show.show_callbacks} />
        </div>

        {layoutMode === "desktop" && (
          <div className="flex flex-col gap-3">
            <Card className="min-w-0 border-border/60 bg-card/80">
              <CardContent className="flex min-h-[2.5rem] items-center justify-center px-3 md:px-4 py-0">
                <SetlistStarRating
                  averageRating={averageRating}
                  onClick={user ? () => setRatingSheetOpen(true) : undefined}
                />
              </CardContent>
            </Card>
            <Card className="min-w-0 border-border/60 bg-card/80">
              <CardContent className="flex min-h-[2.5rem] items-center justify-center px-3 md:px-4 py-0">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {user && (
                    <SetlistAttendButton
                      attended={attended}
                      toggling={toggling}
                      onToggle={toggle}
                    />
                  )}
                  <span className="text-muted-foreground">
                    {attendeeCount} {attendeeCount === 1 ? "attendee" : "attendees"}
                  </span>
                </div>
              </CardContent>
            </Card>
            <SetlistSidebar
              show={show}
              setlist={setlist}
              showLengthRank={showLengthRank}
              changes={changes}
              changesLoading={changesLoading}
              releases={releases}
              hasReleases={hasReleases}
              onOpenChangesModal={() => setOpenChangesModal(true)}
              hoveredCategory={hoveredCategory}
              onCategoryHover={setHoveredCategory}
            />
          </div>
        )}
      </div>

      <SetlistRatingSheet
        open={ratingSheetOpen}
        onOpenChange={setRatingSheetOpen}
        initialRating={userRating}
        initialReview={userReview}
        onSubmit={submitRating}
        submitting={submitting}
      />

      <SetlistShowChangesSheet
        open={openChangesModal}
        onOpenChange={setOpenChangesModal}
        changes={changes}
      />

      <SetlistSongPerformancesSheet
        open={songSheetOpen}
        onOpenChange={setSongSheetOpen}
        entry={songSheetEntry}
        tourName={show.show_tour}
      />

      <SetlistJotySheet
        open={jotySheetOpen}
        onOpenChange={setJotySheetOpen}
        entry={jotySheetEntry}
      />

      <SetlistWtedSheet
        open={wtedSheetOpen}
        onOpenChange={setWtedSheetOpen}
        entry={wtedSheetEntry}
      />

      <Sheet
        open={sidebarSheetOpen}
        onOpenChange={setSidebarSheetOpen}
      >
        <SheetContent
          side="bottom"
          className="max-h-[85vh] flex flex-col rounded-t-none overflow-hidden"
          showCloseButton={false}
        >
          <button
            type="button"
            onClick={() => setSidebarSheetOpen(false)}
            className="flex w-full items-center justify-center gap-2 border-b border-border/50 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Close"
          >
            <X className="size-4" />
            Close
          </button>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <div className="flex flex-col gap-3 max-w-[280px] mx-auto">
              <Card className="min-w-0 border-border/60 bg-card/80">
                <CardContent className="flex min-h-[2.5rem] items-center justify-center px-3 py-0">
                  <SetlistStarRating
                    averageRating={averageRating}
                    onClick={user ? () => setRatingSheetOpen(true) : undefined}
                  />
                </CardContent>
              </Card>
              <Card className="min-w-0 border-border/60 bg-card/80">
                <CardContent className="flex min-h-[2.5rem] items-center justify-center px-3 py-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {user && (
                      <SetlistAttendButton
                        attended={attended}
                        toggling={toggling}
                        onToggle={toggle}
                      />
                    )}
                    <span className="text-muted-foreground">
                      {attendeeCount} {attendeeCount === 1 ? "attendee" : "attendees"}
                    </span>
                  </div>
                </CardContent>
              </Card>
              <SetlistSidebar
                show={show}
                setlist={setlist}
                showLengthRank={showLengthRank}
                changes={changes}
                changesLoading={changesLoading}
                releases={releases}
                hasReleases={hasReleases}
                onOpenChangesModal={() => {
                  setOpenChangesModal(true)
                  setSidebarSheetOpen(false)
                }}
                hoveredCategory={hoveredCategory}
                onCategoryHover={setHoveredCategory}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
