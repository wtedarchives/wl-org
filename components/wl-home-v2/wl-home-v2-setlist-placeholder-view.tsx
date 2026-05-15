"use client"

import {
  useEffect,
  useLayoutEffect,
  useState,
  type CSSProperties,
} from "react"

import { type BreadcrumbItem } from "@/components/setlist-breadcrumb-context"
import { useWlHomeV2OpenArchiveHub } from "@/components/wl-home-v2/wl-home-v2-open-archive-hub-context"
import type { Tour } from "@/hooks/use-setlist-data"
import type { ShowPositionInTour } from "@/hooks/use-show-position-in-tour"
import type { SetlistEntry, Show, ShowDate } from "@/types/setlist"
import { SetlistMediaSection } from "@/components/dpro/setlist/setlist-media-section"
import {
  WlHomeV2SetlistShowBadgesTile,
  WlHomeV2SetlistShowStatsTile,
  isWlHomeV2SetlistShowBadgesTileVisible,
  isWlHomeV2SetlistShowStatsTileVisible,
} from "@/components/wl-home-v2/wl-home-v2-setlist-show-meta-tile"
import { WlHomeV2SetlistTable } from "@/components/wl-home-v2/wl-home-v2-setlist-table"
import type {
  ReleaseToEntriesMap,
  ShowRelease,
} from "@/hooks/use-setlist-releases"
import type { ShowChangeRow } from "@/hooks/use-setlist-show-changes"
import {
  WlHomeV2SetlistShowChangesSection,
  isWlHomeV2SetlistShowChangesSectionVisible,
} from "@/components/wl-home-v2/wl-home-v2-setlist-show-changes-section"
import {
  SetlistSongSpreadCard,
  isSetlistSongSpreadAsideVisible,
} from "@/components/dpro/setlist/setlist-song-spread-card"
import { cn } from "@/lib/utils"
import { WlHomeV2SetlistAsideAccent } from "@/components/wl-home-v2/wl-home-v2-setlist-aside-accent"
import { WlHomeV2SetlistPlaceholderCrumbsBar } from "@/components/wl-home-v2/wl-home-v2-setlist-placeholder-crumbs"
import { WlHomeV2SetlistPlaceholderMainHeader } from "@/components/wl-home-v2/wl-home-v2-setlist-placeholder-main-header"
import {
  WlHomeV2SetlistPlaceholderCommunityLink,
  WlHomeV2SetlistPlaceholderRatingAttendees,
} from "@/components/wl-home-v2/wl-home-v2-setlist-placeholder-tools"
import { TAILWIND_XL_MIN_PX } from "@/components/wl-home-v2/wl-home-v2-years-view.constants"
import { SetlistEgnAttribution } from "@/components/dpro/setlist/setlist-egn-attribution"

type SetlistLayoutMode = "mobile" | "desktop" | null

/**
 * Setlist archive shell: same layout stack as years (`wl-home-v2-years-page` → body →
 * columns → `section` + `aside`). Static mock body from `Setlist.html` (no header/footer/cursor);
 * breadcrumbs use `/old/archive/setlist` resolution when `breadcrumbs` is set.
 */
export function WlHomeV2SetlistPlaceholderView({
  breadcrumbs,
  show,
  showId,
  setlist,
  showAdminUi,
  adminLinkCopied,
  onAdminCopyShowId,
  onAdminEditShow,
  copiedEntryIds,
  onNumberClick,
  showPositionInTour,
  tourShowNav,
  onTourShowSelect,
  tours,
  showDates,
  onTourSelect,
  maxShowCanonId,
  maxShowCanonIdLoading,
  releases,
  releaseToEntriesMap,
  onJotyBadgeClick,
  onSongClick,
  onWtedClick,
  averageRating,
  reviewCount,
  onRatingClick,
  attendeeCount,
  attended,
  attendanceToggling,
  onAttendanceToggle,
  canMarkAttendance,
  showLengthRank,
  showChanges,
  showChangesLoading,
  onOpenSetlistScan,
  hoveredCategory,
  onCategoryHover,
}: {
  breadcrumbs: BreadcrumbItem[] | null
  show: Show
  showId: string
  setlist: SetlistEntry[]
  showAdminUi?: boolean
  adminLinkCopied?: boolean
  onAdminCopyShowId?: () => void
  onAdminEditShow?: () => void
  copiedEntryIds?: Set<string>
  onNumberClick?: (entryId: string) => void
  onJotyBadgeClick: (entry: SetlistEntry) => void
  onSongClick?: (entry: SetlistEntry) => void
  onWtedClick?: (entry: SetlistEntry) => void
  showPositionInTour: ShowPositionInTour | null
  tourShowNav: {
    prevShowId: string | null
    nextShowId: string | null
  } | null
  onTourShowSelect: (showId: string) => void
  tours: Tour[]
  showDates: ShowDate[]
  onTourSelect: (tourId: string) => void
  maxShowCanonId: number | null
  maxShowCanonIdLoading: boolean
  releases: ShowRelease[]
  releaseToEntriesMap: ReleaseToEntriesMap
  averageRating: number
  reviewCount: number
  onRatingClick: () => void
  attendeeCount: number
  attended: boolean
  attendanceToggling: boolean
  onAttendanceToggle: () => void
  canMarkAttendance: boolean
  showLengthRank: number | null
  showChanges: ShowChangeRow[]
  showChangesLoading: boolean
  onOpenSetlistScan?: () => void
  hoveredCategory: string | null
  onCategoryHover: (category: string | null) => void
}) {
  const openArchiveHub = useWlHomeV2OpenArchiveHub()
  const [layoutMode, setLayoutMode] = useState<SetlistLayoutMode>(null)
  const [hoveredReleaseId, setHoveredReleaseId] = useState<string | null>(
    null,
  )

  useEffect(() => {
    setHoveredReleaseId(null)
  }, [showId])

  const hasAverageRating = averageRating > 0
  const ratingValueDisplay = hasAverageRating ?
      averageRating.toFixed(2)
    : "0.00"
  const wlCommunityHref = show.show_wl_link?.trim() ?? ""
  const showWlCommunityLink = wlCommunityHref.length > 0
  const reviewSummary =
    reviewCount > 0 ?
      `${reviewCount.toLocaleString("en-US")} ${reviewCount === 1 ? "review" : "reviews"}`
    : "No reviews yet"

  useLayoutEffect(() => {
    const mq = window.matchMedia(`(min-width: ${TAILWIND_XL_MIN_PX}px)`)
    const apply = () => {
      setLayoutMode(mq.matches ? "desktop" : "mobile")
    }
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])

  const useCompactTools = layoutMode !== "desktop"

  const asideStatsVisible = isWlHomeV2SetlistShowStatsTileVisible(show, setlist)
  const asideBadgesVisible = isWlHomeV2SetlistShowBadgesTileVisible(show)
  const asideSongSpreadVisible = isSetlistSongSpreadAsideVisible(setlist)
  const asideShowChangesVisible = isWlHomeV2SetlistShowChangesSectionVisible(
    showChangesLoading,
    showChanges,
    onOpenSetlistScan,
  )

  /** Strip between tools and next tile only when a block actually follows (avoids a trailing accent). */
  const setlistAsideHasBlocksBelowTools =
    asideStatsVisible ||
    asideSongSpreadVisible ||
    asideShowChangesVisible ||
    asideBadgesVisible

  const showGroupLabel = show.show_group?.trim() ?? ""
  const venueLocation = show.show_venue_location?.trim() ?? ""
  const subvenueLabel = show.show_subvenue?.trim() ?? ""
  const showDetailLabel = show.show_detail?.trim() ?? ""
  const showAlertLabel = show.show_alert?.trim() ?? ""

  const showCanonPositionPill =
    show.show_canonid != null &&
    !maxShowCanonIdLoading &&
    maxShowCanonId != null

  /** Compact layout: split long tour name from "Show n of m" (`< xl`, tour string > 24 chars). */
  const mobileStackTourNameAndPositionLines =
    useCompactTools &&
    (show.show_tour?.length ?? 0) > 24 &&
    showPositionInTour != null

  const toolsProps = {
    hasAverageRating,
    ratingValueDisplay,
    reviewSummary,
    averageRating,
    attendeeCount,
    canMarkAttendance,
    attended,
    attendanceToggling,
    onAttendanceToggle,
    onRatingClick,
    showWlCommunityLink,
    wlCommunityHref,
  }

  return (
    <div className="wl-home-v2-years-page wl-home-v2-setlist">
      <WlHomeV2SetlistPlaceholderCrumbsBar
        breadcrumbs={breadcrumbs}
        showId={showId}
        show={show}
        tours={tours}
        showDates={showDates}
        onTourSelect={onTourSelect}
        onTourShowSelect={onTourShowSelect}
        openArchiveHub={openArchiveHub ?? undefined}
        showAdminUi={showAdminUi}
        adminLinkCopied={adminLinkCopied}
        onAdminCopyShowId={onAdminCopyShowId}
        onAdminEditShow={onAdminEditShow}
      />

      <div className="wl-home-v2-years-body">
        <div
          className={cn(
            "wl-home-v2-years-columns",
            !useCompactTools && "wl-home-v2-years-columns--desktop",
          )}
        >
          <section
            className="wl-home-v2-years-tile wl-home-v2-years-tile--main"
            style={
              {
                "--tile-bg": "url('/newbg3.jpeg')",
              } as CSSProperties
            }
          >
            <div className="wl-home-v2-years-tile-inner min-h-0 flex min-w-0 flex-1 flex-col gap-4">
              <WlHomeV2SetlistPlaceholderMainHeader
                useCompactTools={useCompactTools}
                show={show}
                showGroupLabel={showGroupLabel}
                subvenueLabel={subvenueLabel}
                venueLocation={venueLocation}
                showDetailLabel={showDetailLabel}
                showAlertLabel={showAlertLabel}
                showCanonPositionPill={showCanonPositionPill}
                maxShowCanonId={maxShowCanonId}
                mobileStackTourNameAndPositionLines={
                  mobileStackTourNameAndPositionLines
                }
                showPositionInTour={showPositionInTour}
                tourShowNav={tourShowNav}
                onTourShowSelect={onTourShowSelect}
                toolsProps={toolsProps}
              />

              <div className="wl-home-v2-setlist-main-fill flex min-h-0 min-w-0 flex-1 flex-col gap-4">
                <WlHomeV2SetlistTable
                  show={show}
                  setlist={setlist}
                  showAdminUi={showAdminUi}
                  copiedEntryIds={copiedEntryIds}
                  onNumberClick={onNumberClick}
                  onJotyBadgeClick={onJotyBadgeClick}
                  onSongClick={onSongClick}
                  onWtedClick={onWtedClick}
                  hoveredReleaseId={hoveredReleaseId}
                  releaseToEntriesMap={releaseToEntriesMap}
                  hoveredCategory={hoveredCategory}
                />
                {releases.length > 0 ?
                  <SetlistMediaSection
                    releases={releases}
                    visualVariant="wl-home-v2"
                    onReleaseHover={setHoveredReleaseId}
                  />
                : null}
                {show.egn_sourced === true ?
                  <SetlistEgnAttribution className="w-full shrink-0" />
                : null}
              </div>
            </div>
          </section>

        <aside
          className="wl-home-v2-years-aside wl-home-v2-setlist-aside"
          aria-label="Show tools"
        >
          {!useCompactTools ?
            <>
              <WlHomeV2SetlistAsideAccent showId={showId} slot={0} />
              <section
                className={cn(
                  "wl-home-v2-years-tile",
                  !setlistAsideHasBlocksBelowTools &&
                    "wl-home-v2-setlist-tools-tile--aside-tail",
                )}
                style={
                  {
                    "--tile-bg": "url('/newbg.png')",
                  } as CSSProperties
                }
              >
                <div className="wl-home-v2-years-tile-inner flex flex-col gap-3">
                  <div className="wl-home-v2-setlist-tools-panel">
                    <WlHomeV2SetlistPlaceholderRatingAttendees {...toolsProps} />
                    {showWlCommunityLink ?
                      <WlHomeV2SetlistPlaceholderCommunityLink
                        wlCommunityHref={wlCommunityHref}
                      />
                    : null}
                  </div>
                </div>
              </section>
            </>
          : null}

          {!useCompactTools && setlistAsideHasBlocksBelowTools ?
            <WlHomeV2SetlistAsideAccent showId={showId} slot={1} />
          : null}
          <div className="wl-home-v2-setlist-aside-stats-tiles">
            <WlHomeV2SetlistShowStatsTile
              show={show}
              setlist={setlist}
              showLengthRank={showLengthRank}
            />
            {asideStatsVisible &&
            (asideSongSpreadVisible ||
              asideShowChangesVisible ||
              asideBadgesVisible) ?
              <WlHomeV2SetlistAsideAccent showId={showId} slot={2} />
            : null}
            <SetlistSongSpreadCard
              setlist={setlist}
              hoveredCategory={hoveredCategory}
              onCategoryHover={onCategoryHover}
              visualVariant="wl-home-v2"
            />
            {asideSongSpreadVisible &&
            (asideShowChangesVisible || asideBadgesVisible) ?
              <WlHomeV2SetlistAsideAccent showId={showId} slot={3} />
            : null}
            <WlHomeV2SetlistShowChangesSection
              changes={showChanges}
              loading={showChangesLoading}
              onOpenScan={onOpenSetlistScan}
            />
            {asideShowChangesVisible && asideBadgesVisible ?
              <WlHomeV2SetlistAsideAccent showId={showId} slot={4} />
            : null}
            <WlHomeV2SetlistShowBadgesTile show={show} />
          </div>
        </aside>
        </div>
      </div>
    </div>
  )
}
