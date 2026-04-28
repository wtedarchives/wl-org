"use client"

import { Fragment, type MouseEvent as ReactMouseEvent } from "react"

import { SetlistShowsDropdown } from "@/components/dpro/setlist/setlist-shows-dropdown"
import { SetlistTourDropdown } from "@/components/dpro/setlist/setlist-tour-dropdown"
import {
  WL_V2_ARCHIVES_BREADCRUMB_ROOT,
  type BreadcrumbItem,
} from "@/components/setlist-breadcrumb-context"
import type { Tour } from "@/hooks/use-setlist-data"
import type { Show, ShowDate } from "@/types/setlist"
import { formatSetlistDate } from "@/lib/setlist-utils"

import {
  WL_HOME_V2_SETLIST_SELECT_CONTENT,
  WL_HOME_V2_SETLIST_SELECT_TRIGGER,
} from "@/components/wl-home-v2/wl-home-v2-setlist-placeholder-view.constants"

export type WlHomeV2SetlistPlaceholderCrumbsBarProps = {
  breadcrumbs: BreadcrumbItem[] | null
  showId: string
  show: Show
  tours: Tour[]
  showDates: ShowDate[]
  onTourSelect: (tourId: string) => void
  onTourShowSelect: (showId: string) => void
  openArchiveHub: (() => void) | undefined
}

export function WlHomeV2SetlistPlaceholderCrumbsBar({
  breadcrumbs,
  showId,
  show,
  tours,
  showDates,
  onTourSelect,
  onTourShowSelect,
  openArchiveHub,
}: WlHomeV2SetlistPlaceholderCrumbsBarProps) {
  const onArchivesCrumbClick = (e: ReactMouseEvent<HTMLAnchorElement>) => {
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
  }

  return (
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
  )
}
