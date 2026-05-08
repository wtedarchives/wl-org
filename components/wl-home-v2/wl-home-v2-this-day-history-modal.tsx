"use client"

import { Broadcast, FileAudio } from "@phosphor-icons/react"
import Image from "next/image"
import Link from "next/link"
import { useId } from "react"

import { formatShowDate } from "@/components/home-stats-column/format-show-date"
import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import {
  type WlHomeThisDayInHistoryShow,
  useWlHomeThisDayInHistoryShows,
} from "@/hooks/use-wl-home-this-day-in-history-shows"
import { useShowMetadata } from "@/hooks/use-show-metadata"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import { isSupabaseConfigured } from "@/lib/supabase"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type WlHomeV2ThisDayHistoryModalProps = {
  open: boolean
  onClose: () => void
  headingId: string
}

/** YYYY-MM-DD local; matches tour schedule segment when `show_time` is absent. */
function localCalendarDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function thisDayShowSegment(showDate: string): "past" | "upcoming" {
  const todayStr = localCalendarDateString(new Date())
  const nowMs = Date.now()
  if (showDate < todayStr) return "past"
  if (showDate > todayStr) return "upcoming"
  const parts = showDate.split("-").map(Number)
  const [y, m, d] = parts
  if (!y || !m || !d) return "upcoming"
  const endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999).getTime()
  return nowMs > endOfDay ? "past" : "upcoming"
}

function ThisDayHistoryRow({
  show,
  showsWithSetlists,
  showsWithReleases,
}: {
  show: WlHomeThisDayInHistoryShow
  showsWithSetlists: Set<string>
  showsWithReleases: Set<string>
}) {
  const segment = thisDayShowSegment(show.show_date)
  const hasDateTooltip = Boolean(show.show_group?.trim())

  const dateLink = (
    <Link
      href={getSetlistArchiveUrl(show.show_id)}
      className="wl-home-v2-tour-schedule-date"
    >
      <span className="wl-home-v2-tour-schedule-date-pill">
        {formatShowDate(show.show_date)}
      </span>
    </Link>
  )

  const dateBlock =
    hasDateTooltip ?
      <Tooltip>
        <TooltipTrigger asChild>{dateLink}</TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-[min(280px,calc(100vw-2rem))] text-[11px] leading-snug"
        >
          <div className="font-medium">{show.show_group}</div>
        </TooltipContent>
      </Tooltip>
    : dateLink

  const rowClass = [
    "wl-home-v2-tour-schedule-row",
    segment === "past" ? "wl-home-v2-tour-schedule-row--past" : "",
    segment === "upcoming" ? "wl-home-v2-tour-schedule-row--upcoming" : "",
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <li className={rowClass}>
      {dateBlock}
      <span className="wl-home-v2-tour-schedule-cell wl-home-v2-tour-schedule-list-venue">
        {show.venue_id ?
          <Link
            href={getVenueArchiveUrl(show.venue_id)}
            className="wl-home-v2-tour-schedule-venue-link"
          >
            {show.show_venue_location}
          </Link>
        : show.show_venue_location}
      </span>
      <span className="wl-home-v2-tour-schedule-list-col wl-home-v2-tour-schedule-list-col--icon">
        {showsWithSetlists.has(show.show_id) ?
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={getSetlistArchiveUrl(show.show_id)}
                aria-label="View setlist"
                className="wl-home-v2-tour-schedule-icon-hit text-emerald-600 hover:text-emerald-500"
              >
                <FileAudio className="size-3.5" aria-hidden />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top">
              <span className="text-[11px]">Setlist scan</span>
            </TooltipContent>
          </Tooltip>
        : <span className="wl-home-v2-tour-schedule-icon-placeholder" aria-hidden />}
      </span>
      <span className="wl-home-v2-tour-schedule-list-col wl-home-v2-tour-schedule-list-col--icon">
        {showsWithReleases.has(show.show_id) ?
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={getSetlistArchiveUrl(show.show_id)}
                aria-label="View releases"
                className="wl-home-v2-tour-schedule-icon-hit text-rose-600 hover:text-rose-500"
              >
                <Broadcast className="size-3.5" aria-hidden />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top">
              <span className="text-[11px]">Media available</span>
            </TooltipContent>
          </Tooltip>
        : <span className="wl-home-v2-tour-schedule-icon-placeholder" aria-hidden />}
      </span>
      <span className="wl-home-v2-tour-schedule-list-col wl-home-v2-tour-schedule-list-col--icon">
        {show.show_wl_link ?
          <Tooltip>
            <TooltipTrigger asChild>
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
                  width={960}
                  height={960}
                  className="h-3.5 w-auto max-h-3.5 object-contain shrink-0"
                />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top">
              Chat in the Wysteria Lane Community
            </TooltipContent>
          </Tooltip>
        : <span className="wl-home-v2-tour-schedule-icon-placeholder" aria-hidden />}
      </span>
      <span className="wl-home-v2-tour-schedule-list-col wl-home-v2-tour-schedule-list-col--icon wl-home-v2-tour-schedule-list-col--goose">
        {show.show_group === "Goose" ?
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="wl-home-v2-tour-schedule-goose-hit" aria-label="Goose show">
                <Image
                  src="/Goose2.png"
                  alt=""
                  width={1500}
                  height={750}
                  className="mx-auto h-3.5 w-auto max-h-3.5 max-w-[min(100%,28px)] object-contain shrink-0"
                />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">Goose show</TooltipContent>
          </Tooltip>
        : <span className="wl-home-v2-tour-schedule-icon-placeholder" aria-hidden />}
      </span>
    </li>
  )
}

/** Same shell as tour schedule; list layout with matching indicators and section tint. */
export function WlHomeV2ThisDayHistoryModal({
  open,
  onClose,
  headingId,
}: WlHomeV2ThisDayHistoryModalProps) {
  const subtextId = useId()
  const { shows, loading } = useWlHomeThisDayInHistoryShows(open)

  const { showsWithSetlists, showsWithReleases } = useShowMetadata(
    shows,
    new Date().getFullYear().toString(),
  )

  useWlHomeV2ScrollLock(open)

  const configured = isSupabaseConfigured()

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className={"modal-backdrop" + (open ? " open" : "")}
        id="this-day-history-modal"
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
              <h3 id={headingId}>Today in Goose History</h3>
              <p id={subtextId} className="modal-request-sub">
                Shows from this calendar day across Goose history (local date).
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
              <p className="wl-home-v2-tour-schedule-empty">
                No shows occurred on this date in Goose history.
              </p>
            : <TooltipProvider delayDuration={300}>
                <div className="wl-home-v2-tour-schedule-scroll">
                  <ul
                    className="wl-home-v2-tour-schedule-rows"
                    aria-label="Shows on this calendar day"
                  >
                    {shows.map((show) => (
                      <ThisDayHistoryRow
                        key={`${show.show_id}-${show.show_date}`}
                        show={show}
                        showsWithSetlists={showsWithSetlists}
                        showsWithReleases={showsWithReleases}
                      />
                    ))}
                  </ul>
                </div>
              </TooltipProvider>
            }
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
