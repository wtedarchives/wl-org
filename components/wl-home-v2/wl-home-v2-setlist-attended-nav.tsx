"use client"

import { CaretLeft, CaretRight } from "@phosphor-icons/react"

import type {
  AttendedGooseCanonNav,
  AttendedGooseCanonShowRow,
} from "@/lib/user-attended-goose-canon-nav"
import { WlHomeV2SetlistAttendedShowsDropdown } from "@/components/wl-home-v2/wl-home-v2-setlist-attended-shows-dropdown"
import { cn } from "@/lib/utils"

export type WlHomeV2SetlistAttendedNavProps = {
  visible: boolean
  nav: AttendedGooseCanonNav | null
  shows: AttendedGooseCanonShowRow[]
  currentShowId: string
  onShowSelect: (showId: string) => void
}

export function WlHomeV2SetlistAttendedNav({
  visible,
  nav,
  shows,
  currentShowId,
  onShowSelect,
}: WlHomeV2SetlistAttendedNavProps) {
  return (
    <div
      className={cn(
        "wl-home-v2-setlist-tools-panel__attended-nav-shell",
        visible && "wl-home-v2-setlist-tools-panel__attended-nav-shell--visible",
      )}
      aria-hidden={!visible}
    >
      <div className="wl-home-v2-setlist-tools-panel__attended-nav-inner">
        <div className="wl-home-v2-setlist-tools-attended-nav">
          <button
            type="button"
            className="nav-btn"
            aria-label="Previous attended Goose show"
            disabled={!visible || !nav?.prevShowId}
            tabIndex={visible ? 0 : -1}
            onClick={() =>
              nav?.prevShowId && onShowSelect(nav.prevShowId)
            }
          >
            <CaretLeft
              className="size-3.5 shrink-0 opacity-90"
              aria-hidden
            />
            Prev
          </button>
          {nav ?
            <span className="meta-tour wl-home-v2-setlist-attended-nav-label">
              Your{" "}
              <WlHomeV2SetlistAttendedShowsDropdown
                shows={shows}
                currentShowId={currentShowId}
                position={nav.position}
                onShowSelect={onShowSelect}
              />{" "}
              Goose Show
            </span>
          : null}
          <button
            type="button"
            className="nav-btn"
            aria-label="Next attended Goose show"
            disabled={!visible || !nav?.nextShowId}
            tabIndex={visible ? 0 : -1}
            onClick={() =>
              nav?.nextShowId && onShowSelect(nav.nextShowId)
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
  )
}
