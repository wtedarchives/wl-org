"use client"

import Link from "next/link"
import { CaretLeft, CaretRight } from "@phosphor-icons/react"

import { cn } from "@/lib/utils"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"
import type { Show } from "@/types/setlist"
import type { ShowPositionInTour } from "@/hooks/use-show-position-in-tour"
import { formatSetlistDate, formatShowWeekday } from "@/lib/setlist-utils"

import {
  type WlHomeV2SetlistPlaceholderToolsProps,
} from "@/components/wl-home-v2/wl-home-v2-setlist-placeholder-tools"
import { WlHomeV2SetlistToolsPanel } from "@/components/wl-home-v2/wl-home-v2-setlist-tools-panel"
import { WlHomeV2SetlistShowHeaderPoster } from "@/components/wl-home-v2/wl-home-v2-setlist-show-header-poster"
import type { UserAttendedGooseCanonNavState } from "@/hooks/use-user-attended-goose-canon-nav"
import { useShowPosters } from "@/hooks/use-show-poster-image"

export type WlHomeV2SetlistPlaceholderMainHeaderProps = {
  useCompactTools: boolean
  show: Show
  showGroupLabel: string
  subvenueLabel: string
  venueLocation: string
  showDetailLabel: string
  showAlertLabel: string
  showCanonPositionPill: boolean
  maxShowCanonId: number | null
  mobileStackTourNameAndPositionLines: boolean
  showPositionInTour: ShowPositionInTour | null
  tourShowNav: {
    prevShowId: string | null
    nextShowId: string | null
  } | null
  onTourShowSelect: (showId: string) => void
  toolsProps: WlHomeV2SetlistPlaceholderToolsProps
  attendedGooseCanonNav: UserAttendedGooseCanonNavState
  onAttendedShowSelect: (showId: string) => void
}

export function WlHomeV2SetlistPlaceholderMainHeader({
  useCompactTools,
  show,
  showGroupLabel,
  subvenueLabel,
  venueLocation,
  showDetailLabel,
  showAlertLabel,
  showCanonPositionPill,
  maxShowCanonId,
  mobileStackTourNameAndPositionLines,
  showPositionInTour,
  tourShowNav,
  onTourShowSelect,
  toolsProps,
  attendedGooseCanonNav,
  onAttendedShowSelect,
}: WlHomeV2SetlistPlaceholderMainHeaderProps) {
  /** Mobile: two lines whenever both subvenue and city exist (ignore show_detail). Desktop: stacked only when there's no show_detail. */
  const stackSubvenueLocation =
    useCompactTools ?
      Boolean(subvenueLabel && venueLocation)
    : Boolean(!showDetailLabel && subvenueLabel && venueLocation)

  const showHeaderCanonPillJsx =
    showCanonPositionPill ?
      <span className="pos show-header-canon-pill">
        SHOW {show.show_canonid!.toLocaleString("en-US")} OF{" "}
        {maxShowCanonId!.toLocaleString("en-US")}
      </span>
    : null

  const showWeekdayLabel = formatShowWeekday(show.show_date)
  const posters = useShowPosters(show.show_id)
  const hasPosters = posters.length > 0
  /** Compact: pill above tour when poster fills the top-right; otherwise top-right of title. */
  const compactCanonInTitle =
    useCompactTools && showCanonPositionPill && !hasPosters
  const compactCanonAboveTour =
    useCompactTools && showCanonPositionPill && hasPosters

  return (
    <div
      className={cn(
        useCompactTools && "wl-home-v2-setlist-compact-header-row",
      )}
    >
      <div className="show-header">
        {showWeekdayLabel ?
          <div className="show-header-weekday-rail" aria-hidden="true">
            <span className="show-header-weekday-rail-text">
              {showWeekdayLabel}
            </span>
          </div>
        : null}
        <div className="show-header-main">
        <div className="show-header-lead">
        <div className="left">
          <div
            className={cn(
              "show-header-title-row",
              compactCanonInTitle && "show-header-title-row--with-canon",
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
            {compactCanonInTitle ? showHeaderCanonPillJsx : null}
          </div>
          {subvenueLabel || venueLocation ?
            <div
              className={cn(
                "venue",
                stackSubvenueLocation &&
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
                stackSubvenueLocation || !subvenueLabel ?
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
          {hasPosters ?
            <WlHomeV2SetlistShowHeaderPoster posters={posters} showThumbnail />
          : null}
        </div>
        <div className="show-header-nav">
            {!useCompactTools && showHeaderCanonPillJsx}
            <div className="show-header-nav-tour-block">
              {compactCanonAboveTour ? showHeaderCanonPillJsx : null}
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
      </div>

      {useCompactTools ?
        <div className="wl-home-v2-setlist-main-tools-cards">
          <WlHomeV2SetlistToolsPanel
            toolsProps={toolsProps}
            attendedNav={attendedGooseCanonNav}
            currentShowId={show.show_id}
            onAttendedShowSelect={onAttendedShowSelect}
            panelClassName="wl-home-v2-setlist-tools-panel--mobile-below-header"
          />
        </div>
      : null}
    </div>
  )
}
