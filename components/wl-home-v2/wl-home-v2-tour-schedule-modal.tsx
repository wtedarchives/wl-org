"use client"

import { Broadcast, FileAudio } from "@phosphor-icons/react"
import Image from "next/image"
import Link from "next/link"
import { useId, type ReactNode } from "react"

import { formatShowDate } from "@/components/home-stats-column/format-show-date"
import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import {
  type WlHomeTourScheduleShow,
  useWlHomeTourScheduleShows,
} from "@/hooks/use-wl-home-tour-schedule-shows"
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

type WlHomeV2TourScheduleModalProps = {
  open: boolean
  onClose: () => void
  headingId: string
}

function TourScheduleRow({
  railCell,
  show,
  showsWithSetlists,
  showsWithReleases,
}: {
  railCell: ReactNode
  show: WlHomeTourScheduleShow
  showsWithSetlists: Set<string>
  showsWithReleases: Set<string>
}) {
  const hasDateTooltip =
    Boolean(show.show_group?.trim()) ||
    Boolean(show.show_tour?.trim()) ||
    Boolean(show.show_detail?.trim())

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
          {show.show_tour ?
            <div className="text-muted-foreground">{show.show_tour}</div>
          : null}
          {show.show_detail ?
            <div className="mt-0.5 text-muted-foreground">
              {show.show_detail}
            </div>
          : null}
        </TooltipContent>
      </Tooltip>
    : dateLink

  const rowClassName = [
    "wl-home-v2-tour-schedule-row",
    show.segment === "past" ? "wl-home-v2-tour-schedule-row--past" : "",
    show.segment === "upcoming" ?
      "wl-home-v2-tour-schedule-row--upcoming"
    : "",
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <tr className={rowClassName}>
      {railCell}
      <td className="wl-home-v2-tour-schedule-td wl-home-v2-tour-schedule-td--date">
        {dateBlock}
      </td>
      <td className="wl-home-v2-tour-schedule-td wl-home-v2-tour-schedule-venue">
        {show.show_subvenue ?
          <Tooltip>
            <TooltipTrigger asChild>
              {show.venue_id ?
                <Link
                  href={getVenueArchiveUrl(show.venue_id)}
                  className="wl-home-v2-tour-schedule-venue-link"
                >
                  {show.show_venue_location}
                </Link>
              : <span>{show.show_venue_location}</span>}
            </TooltipTrigger>
            <TooltipContent side="top">
              <span className="text-[11px]">{show.show_subvenue}</span>
            </TooltipContent>
          </Tooltip>
        : show.venue_id ?
          <Link
            href={getVenueArchiveUrl(show.venue_id)}
            className="wl-home-v2-tour-schedule-venue-link"
          >
            {show.show_venue_location}
          </Link>
        : <span>{show.show_venue_location}</span>}
      </td>
      <td className="wl-home-v2-tour-schedule-td wl-home-v2-tour-schedule-td--icon">
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
      </td>
      <td className="wl-home-v2-tour-schedule-td wl-home-v2-tour-schedule-td--icon">
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
      </td>
      <td className="wl-home-v2-tour-schedule-td wl-home-v2-tour-schedule-td--icon wl-home-v2-tour-schedule-td--wl">
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
      </td>
      <td className="wl-home-v2-tour-schedule-td wl-home-v2-tour-schedule-td--icon wl-home-v2-tour-schedule-td--goose">
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
      </td>
    </tr>
  )
}

/** Same centered shell as Request a Song / schedule embed; scrollable Goose show list (past + upcoming). */
export function WlHomeV2TourScheduleModal({
  open,
  onClose,
  headingId,
}: WlHomeV2TourScheduleModalProps) {
  const subtextId = useId()
  const { shows, loading } = useWlHomeTourScheduleShows(open)

  const { showsWithSetlists, showsWithReleases } = useShowMetadata(
    shows,
    new Date().getFullYear().toString(),
  )

  useWlHomeV2ScrollLock(open)

  const configured = isSupabaseConfigured()

  const pastShows = shows.filter((s) => s.segment === "past")
  const upcomingShows = shows.filter((s) => s.segment === "upcoming")

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
            : <TooltipProvider delayDuration={300}>
                <div className="wl-home-v2-tour-schedule-scroll">
                  <table className="wl-home-v2-tour-schedule-table">
                    <caption className="sr-only">
                      Tour schedule: section rails for last five and next five shows,
                      dates, venues, and column indicators for setlist, media,
                      community, and Goose shows
                    </caption>
                    <tbody>
                      {pastShows.map((show, index) => (
                        <TourScheduleRow
                          key={show.show_id}
                          railCell={
                            index === 0 ?
                              <td
                                rowSpan={pastShows.length}
                                className={
                                  "wl-home-v2-tour-schedule-td wl-home-v2-tour-schedule-rail wl-home-v2-tour-schedule-rail--past"
                                }
                              >
                                <span className="wl-home-v2-tour-schedule-rail-text-vertical">
                                  Last 5 shows
                                </span>
                              </td>
                            : null
                          }
                          show={show}
                          showsWithSetlists={showsWithSetlists}
                          showsWithReleases={showsWithReleases}
                        />
                      ))}
                      {upcomingShows.map((show, index) => (
                        <TourScheduleRow
                          key={show.show_id}
                          railCell={
                            index === 0 ?
                              <td
                                rowSpan={upcomingShows.length}
                                className={
                                  "wl-home-v2-tour-schedule-td wl-home-v2-tour-schedule-rail wl-home-v2-tour-schedule-rail--upcoming"
                                }
                              >
                                <span className="wl-home-v2-tour-schedule-rail-text-vertical">
                                  Next 5 shows
                                </span>
                              </td>
                            : null
                          }
                          show={show}
                          showsWithSetlists={showsWithSetlists}
                          showsWithReleases={showsWithReleases}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </TooltipProvider>
            }
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
