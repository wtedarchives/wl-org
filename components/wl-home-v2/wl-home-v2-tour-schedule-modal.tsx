"use client"

import Image from "next/image"
import Link from "next/link"
import { useId } from "react"

import { formatShowDate } from "@/components/home-stats-column/format-show-date"
import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import {
  type WlHomeTourScheduleShow,
  useWlHomeTourScheduleShows,
} from "@/hooks/use-wl-home-tour-schedule-shows"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import { isSupabaseConfigured } from "@/lib/supabase"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"

type WlHomeV2TourScheduleModalProps = {
  open: boolean
  onClose: () => void
  headingId: string
}

function TourScheduleRow({
  show,
  highlightMostRecent,
}: {
  show: WlHomeTourScheduleShow
  highlightMostRecent: boolean
}) {
  return (
    <li
      className={[
        "wl-home-v2-tour-schedule-row",
        show.segment === "past" ? "wl-home-v2-tour-schedule-row--past" : "",
        show.segment === "upcoming" ?
          "wl-home-v2-tour-schedule-row--upcoming"
        : "",
        highlightMostRecent ?
          "wl-home-v2-tour-schedule-row--most-recent-past"
        : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Link
        href={getSetlistArchiveUrl(show.show_id)}
        className="wl-home-v2-tour-schedule-date"
      >
        <span className="wl-home-v2-tour-schedule-date-pill">
          {formatShowDate(show.show_date)}
        </span>
      </Link>
      <span className="wl-home-v2-tour-schedule-cell wl-home-v2-tour-schedule-venue">
        {show.venue_id ?
          <Link
            href={getVenueArchiveUrl(show.venue_id)}
            className="wl-home-v2-tour-schedule-venue-link"
          >
            {show.show_venue_location}
          </Link>
        : show.show_venue_location}
      </span>
      <span className="wl-home-v2-tour-schedule-cell wl-home-v2-tour-schedule-group">
        {show.show_group}
      </span>
      <span className="wl-home-v2-tour-schedule-cell wl-home-v2-tour-schedule-wl">
        {show.show_wl_link ?
          <Link
            href={show.show_wl_link}
            target="_blank"
            rel="noopener noreferrer"
            className="wl-home-v2-tour-schedule-wl-link"
            aria-label="Wysteria Lane article"
          >
            <Image
              src="/WL.png"
              alt=""
              width={14}
              height={14}
              className="h-3.5 w-auto"
            />
          </Link>
        : null}
      </span>
    </li>
  )
}

/** Same centered shell as Request a Song / schedule embed; scrollable Goose show list (past + upcoming). */
export function WlHomeV2TourScheduleModal({
  open,
  onClose,
  headingId,
}: WlHomeV2TourScheduleModalProps) {
  const subtextId = useId()
  const { shows, loading, mostRecentPastShowId } =
    useWlHomeTourScheduleShows(open)

  useWlHomeV2ScrollLock(open)

  const configured = isSupabaseConfigured()

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className={"modal-backdrop" + (open ? " open" : "")}
        id="tour-schedule-modal"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          className="modal modal--wted-request modal--tour-schedule"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          aria-describedby={subtextId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-request-head">
            <div className="modal-request-head-text">
              <h3 id={headingId}>Tour Schedule</h3>
              <p id={subtextId} className="modal-request-sub">
                Recent and upcoming Goose shows.
              </p>
            </div>
            <button
              type="button"
              className="modal-request-close"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="modal-request-body wl-home-v2-tour-schedule-body">
            {!configured ?
              <p className="wl-home-v2-tour-schedule-empty">
                Trouble communicating with the database server. Please reload the
                page.
              </p>
            : loading ?
              <p className="wl-home-v2-tour-schedule-empty">Loading shows…</p>
            : shows.length === 0 ?
              <p className="wl-home-v2-tour-schedule-empty">No shows found.</p>
            : <div className="wl-home-v2-tour-schedule-scroll">
                <ul className="wl-home-v2-tour-schedule-rows">
                  {shows.map((show) => (
                    <TourScheduleRow
                      key={show.show_id}
                      show={show}
                      highlightMostRecent={
                        show.segment === "past" &&
                        mostRecentPastShowId != null &&
                        show.show_id === mostRecentPastShowId
                      }
                    />
                  ))}
                </ul>
              </div>
            }
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
