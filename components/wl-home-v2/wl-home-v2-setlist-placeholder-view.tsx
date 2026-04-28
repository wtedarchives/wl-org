"use client"

import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  CaretLeft,
  CaretRight,
  Check,
  UserPlus,
  Users,
} from "@phosphor-icons/react"

import {
  WL_V2_ARCHIVES_BREADCRUMB_ROOT,
  type BreadcrumbItem,
} from "@/components/setlist-breadcrumb-context"
import { useWlHomeV2OpenArchiveHub } from "@/components/wl-home-v2/wl-home-v2-open-archive-hub-context"
import { SetlistShowsDropdown } from "@/components/dpro/setlist/setlist-shows-dropdown"
import { SetlistTourDropdown } from "@/components/dpro/setlist/setlist-tour-dropdown"
import { formatSetlistDate } from "@/lib/setlist-utils"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"
import { cn } from "@/lib/utils"
import type { Tour } from "@/hooks/use-setlist-data"
import type { ShowPositionInTour } from "@/hooks/use-show-position-in-tour"
import type { SetlistEntry, Show, ShowDate } from "@/types/setlist"
import { SetlistMediaSection } from "@/components/dpro/setlist/setlist-media-section"
import { SetlistRatingStarsRow } from "@/components/dpro/setlist/setlist-rating-card"
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
import { HOME_BG_IMAGES } from "@/components/wl-home-shared"

const WL_HOME_V2_SETLIST_SELECT_CONTENT =
  "wl-home-v2-setlist-select-content border-0 shadow-lg ring-1 ring-[rgb(53,55,54)]"

const WL_HOME_V2_SETLIST_SELECT_TRIGGER =
  "wl-home-v2-setlist-select-trigger h-auto min-h-0 w-max max-w-full min-w-0 gap-1.5 px-2.5 py-1 text-xs shadow-none items-center"

function fnv1a32Hex(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Pseudo-random pick per show + divider slot (stable for SSR / hydration). */
function wlHomeV2SetlistAsideAccentTileBg(showId: string, slot: number): string {
  const path =
    HOME_BG_IMAGES[
      fnv1a32Hex(`${showId}\0aside-accent-${slot}`) % HOME_BG_IMAGES.length
    ]
  return `url('${path}')`
}

function WlHomeV2SetlistAsideAccent({
  showId,
  slot,
}: {
  showId: string
  slot: number
}) {
  return (
    <div
      className="wl-home-v2-setlist-aside-top-accent"
      style={
        {
          "--tile-bg": wlHomeV2SetlistAsideAccentTileBg(showId, slot),
        } as CSSProperties
      }
      aria-hidden
    />
  )
}

/** Match `wl-home-v2-years-view` / Tailwind `xl` — desktop two-column layout. */
const TAILWIND_XL_MIN_PX = 1280

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
  /** Without show detail, subvenue + city read cleaner on two lines than "A · B". */
  const venueStackSubvenueLocation =
    !showDetailLabel && !!subvenueLabel && !!venueLocation
  const showCanonPositionPill =
    show.show_canonid != null &&
    !maxShowCanonIdLoading &&
    maxShowCanonId != null

  const onArchivesCrumbClick = useCallback(
    (e: ReactMouseEvent<HTMLAnchorElement>) => {
      if (
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return
      }
      e.preventDefault()
      openArchiveHub?.()
    },
    [openArchiveHub],
  )

  /** Shared rating + attendees cells (aside on desktop; main column under header on mobile). */
  const setlistRatingAttendeesToolsCards = (
    <>
      <button
        type="button"
        className="wl-home-v2-setlist-tools-panel__rating side-card"
        onClick={onRatingClick}
        aria-label={
          hasAverageRating ?
            `Rating: ${ratingValueDisplay} out of 5. Click to rate or review.`
          : "Click to rate this show"
        }
      >
        <div className="sc-label">Rating</div>
        <div className="sc-stars-row">
          <SetlistRatingStarsRow
            rating={averageRating}
            sizeClassName="size-[14px]"
            fillClassName="text-[#ffd86b]"
            emptyClassName="text-white/25"
          />
        </div>
        <div className="sc-value">{ratingValueDisplay}</div>
        <div className="sc-sub">{reviewSummary}</div>
      </button>
      <div className="wl-home-v2-setlist-tools-panel__attendees side-card">
        <div className="sc-label normal-case tracking-normal">attendees</div>
        <div className="sc-value flex items-center gap-2">
          {attendeeCount.toLocaleString("en-US")}
          <Users
            className="size-[1.15em] shrink-0 text-white/85"
            aria-hidden
          />
        </div>
        {canMarkAttendance ?
          <button
            type="button"
            className={
              "attend normal-case tracking-normal inline-flex items-center justify-center gap-1.5 " +
              (attended ? "attended" : "")
            }
            id="attend-btn"
            disabled={attendanceToggling}
            onClick={onAttendanceToggle}
          >
            {attendanceToggling ?
              "…"
            : attended ?
              <>
                <Check className="size-4 shrink-0" weight="bold" aria-hidden />
                attended
              </>
            : <>
                <UserPlus className="size-4 shrink-0" aria-hidden />
                i was there
              </>
            }
          </button>
        : null}
      </div>
    </>
  )

  const setlistToolsCommunityChatLink =
    showWlCommunityLink ?
      <a
        href={wlCommunityHref}
        target="_blank"
        rel="noopener noreferrer"
        className="wl-home-v2-setlist-tools-panel__chat wbtn green"
      >
        <span className="wbtn-text inline-flex min-w-0 items-center gap-2">
          <Image
            src="/WL.png"
            alt=""
            width={22}
            height={22}
            className="size-[22px] shrink-0 object-contain"
            unoptimized
          />
          <span>Chat in the WTED Community</span>
        </span>
        <ArrowRight
          className="wbtn-icon size-4 shrink-0"
          weight="bold"
          aria-hidden
        />
      </a>
    : null

  const showHeaderCanonPillJsx =
    showCanonPositionPill ?
      <span className="pos show-header-canon-pill">
        SHOW {show.show_canonid!.toLocaleString("en-US")} OF{" "}
        {maxShowCanonId!.toLocaleString("en-US")}
      </span>
    : null

  /** Compact layout: split long tour name from "Show n of m" (`< xl`, tour string > 24 chars). */
  const mobileStackTourNameAndPositionLines =
    useCompactTools &&
    (show.show_tour?.length ?? 0) > 24 &&
    showPositionInTour != null

  return (
    <div className="wl-home-v2-years-page wl-home-v2-setlist">
      <div className="wl-home-v2-setlist-crumbs-bar">
        <nav
          className="wl-home-v2-setlist-crumbs-trail"
          aria-label="Breadcrumb"
        >
          {breadcrumbs != null && breadcrumbs.length > 0 ?
            breadcrumbs.map((item, i) => {
              const isArchivesHub =
                item.href === WL_V2_ARCHIVES_BREADCRUMB_ROOT.href &&
                item.label === WL_V2_ARCHIVES_BREADCRUMB_ROOT.label
              const isLast = i === breadcrumbs.length - 1
              return (
                <Fragment key={`${i}-${item.label}`}>
                  {i > 0 ?
                    <span className="sep">&gt;</span>
                  : null}
                  {isLast ?
                    <span className="here">{item.label}</span>
                  : isArchivesHub && openArchiveHub ?
                    <a href={item.href} onClick={onArchivesCrumbClick}>
                      {item.label}
                    </a>
                  : <a href={item.href}>{item.label}</a>}
                </Fragment>
              )
            })
          : null}
        </nav>
        <div
          className="wl-home-v2-setlist-crumbs-selectors"
          aria-label="Tour and show date"
        >
          <div className="wl-home-v2-setlist-crumbs-selectors-cell min-w-0">
            <SetlistTourDropdown
              tours={tours}
              currentTourId={show.tour_id ?? ""}
              currentTourName={show.show_tour}
              onTourSelect={onTourSelect}
              triggerClassName={WL_HOME_V2_SETLIST_SELECT_TRIGGER}
              contentClassName={WL_HOME_V2_SETLIST_SELECT_CONTENT}
            />
          </div>
          <div className="wl-home-v2-setlist-crumbs-selectors-cell min-w-0">
            <SetlistShowsDropdown
              showDates={showDates}
              currentShowId={showId}
              currentLabel={formatSetlistDate(show.show_date)}
              onShowSelect={onTourShowSelect}
              triggerClassName={WL_HOME_V2_SETLIST_SELECT_TRIGGER}
              contentClassName={WL_HOME_V2_SETLIST_SELECT_CONTENT}
            />
          </div>
        </div>
      </div>

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
          <div
            className={cn(
              useCompactTools && "wl-home-v2-setlist-compact-header-row",
            )}
          >
          <div className="show-header">
            <div className="left">
              <div
                className={cn(
                  "show-header-title-row",
                  useCompactTools &&
                    showCanonPositionPill &&
                    "show-header-title-row--with-canon",
                )}
              >
                <h1 className="show-header-heading">
                  <span className="date">{formatSetlistDate(show.show_date)}</span>
                  {showGroupLabel ?
                    <>
                      <span className="show-header-title-divider" aria-hidden="true">
                        {" "}
                        ·{" "}
                      </span>
                      <span className="show-header-title-group">{showGroupLabel}</span>
                    </>
                  : null}
                </h1>
                {useCompactTools && showHeaderCanonPillJsx}
              </div>
              {subvenueLabel || venueLocation ?
                <div
                  className={cn(
                    "venue",
                    venueStackSubvenueLocation &&
                      "venue--stack-subvenue-location",
                  )}
                >
                  {subvenueLabel ?
                    show.venue_id ?
                      <Link
                        href={getVenueArchiveUrl(show.venue_id)}
                        className="venue-subvenue-link"
                      >
                        {subvenueLabel}
                      </Link>
                    : show.show_subvenue_venue ?
                      <Link
                        href={getVenueArchiveUrl(show.show_subvenue_venue)}
                        className="venue-subvenue-link"
                      >
                        {subvenueLabel}
                      </Link>
                    : <span className="venue-subvenue-text">{subvenueLabel}</span>
                  : null}
                  {venueLocation ?
                    venueStackSubvenueLocation || !subvenueLabel ?
                      <span className="venue-location">{venueLocation}</span>
                    : <>
                        <span className="city" aria-hidden="true">
                          ·
                        </span>
                        <span className="venue-location">{venueLocation}</span>
                      </>
                  : null}
                </div>
              : null}
              {showDetailLabel ?
                <div className="show-header-detail">
                  <span className="show-detail-pill">{showDetailLabel}</span>
                </div>
              : null}
              {showAlertLabel ?
                <div className="show-header-alert" role="alert">
                  <span className="show-alert-pill">{showAlertLabel}</span>
                </div>
              : null}
            </div>
            <div className="show-header-nav">
              {!useCompactTools && showHeaderCanonPillJsx}
              <div className="show-header-nav-tour-block">
                {show.show_tour || showPositionInTour ?
                  <div
                    className={cn(
                      "meta show-header-nav-tour",
                      mobileStackTourNameAndPositionLines &&
                        "show-header-nav-tour--stack-lines",
                    )}
                  >
                    {show.show_tour ?
                      <span className="meta-tour">{show.show_tour}</span>
                    : null}
                    {!mobileStackTourNameAndPositionLines &&
                    show.show_tour &&
                    showPositionInTour ?
                      <span aria-hidden="true"> · </span>
                    : null}
                    {showPositionInTour ?
                      <span className="meta-tour">
                        Show {showPositionInTour.position} of{" "}
                        {showPositionInTour.total}
                      </span>
                    : null}
                  </div>
                : null}
                <div className="nav-btns">
                  <button
                    type="button"
                    className="nav-btn"
                    aria-label="Previous show in tour"
                    disabled={!tourShowNav?.prevShowId}
                    onClick={() =>
                      tourShowNav?.prevShowId &&
                      onTourShowSelect(tourShowNav.prevShowId)
                    }
                  >
                    <CaretLeft
                      className="size-3.5 shrink-0 opacity-90"
                      aria-hidden
                    />
                    Prev
                  </button>
                  <button
                    type="button"
                    className="nav-btn"
                    aria-label="Next show in tour"
                    disabled={!tourShowNav?.nextShowId}
                    onClick={() =>
                      tourShowNav?.nextShowId &&
                      onTourShowSelect(tourShowNav.nextShowId)
                    }
                  >
                    Next
                    <CaretRight
                      className="size-3.5 shrink-0 opacity-90"
                      aria-hidden
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {useCompactTools ?
            <div className="wl-home-v2-setlist-main-tools-cards">
              <div className="wl-home-v2-setlist-tools-panel wl-home-v2-setlist-tools-panel--mobile-below-header">
                {setlistRatingAttendeesToolsCards}
                {setlistToolsCommunityChatLink}
              </div>
            </div>
          : null}
          </div>

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
                    {setlistRatingAttendeesToolsCards}
                    {setlistToolsCommunityChatLink}
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
