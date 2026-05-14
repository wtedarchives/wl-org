"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { Check } from "lucide-react"

import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"
import { cn } from "@/lib/utils"
import { formatShowDate } from "@/lib/utils/attendance-utils"
import type { AttendShow } from "@/hooks/use-attend-show-data"
import type { SortColumn } from "@/hooks/use-table-sort"

import "./attend-show-manage.css"

interface AttendShowManagerTableProps {
  shows: AttendShow[]
  loading: boolean
  searchQuery: string
  onSort: (column: SortColumn) => void
  getSortIcon: (column: SortColumn) => ReactNode
  onAttendanceToggle: (show: AttendShow) => void
}

export function AttendShowManagerTable({
  shows,
  loading,
  searchQuery,
  onSort,
  getSortIcon,
  onAttendanceToggle,
}: AttendShowManagerTableProps) {
  if (loading) {
    return (
      <div className="wl-attend-manage__loading">
        <div className="wl-attend-manage__loading-dots">
          <div className="wl-attend-manage__loading-dot" />
          <div
            className="wl-attend-manage__loading-dot wl-attend-manage__loading-dot--2"
          />
          <div
            className="wl-attend-manage__loading-dot wl-attend-manage__loading-dot--3"
          />
        </div>
        <p className="wl-attend-manage__loading-msg">Loading shows…</p>
      </div>
    )
  }

  const emptyMsg =
    searchQuery ?
      "No shows matching your search"
    : "No shows found for this year"

  return (
    <div className="wl-attend-manage__table-scroll">
      <table className="wl-attend-manage__table">
        <thead>
          <tr>
            <th scope="col" className="wl-attend-manage__th wl-attend-manage__th--check">
              <Check className="size-4" aria-hidden />
              <span className="sr-only">Attended</span>
            </th>
            <th scope="col" className="wl-attend-manage__th">
              <button
                type="button"
                className="wl-attend-manage__sort-btn"
                onClick={() => onSort("show_date")}
              >
                Date {getSortIcon("show_date")}
              </button>
            </th>
            <th scope="col" className="wl-attend-manage__th">
              <button
                type="button"
                className="wl-attend-manage__sort-btn"
                onClick={() => onSort("show_group")}
              >
                Group {getSortIcon("show_group")}
              </button>
            </th>
            <th scope="col" className="wl-attend-manage__th">
              <button
                type="button"
                className="wl-attend-manage__sort-btn"
                onClick={() => onSort("show_subvenue")}
              >
                Venue {getSortIcon("show_subvenue")}
              </button>
            </th>
            <th scope="col" className="wl-attend-manage__th">
              <button
                type="button"
                className="wl-attend-manage__sort-btn"
                onClick={() => onSort("show_venue_location")}
              >
                Location {getSortIcon("show_venue_location")}
              </button>
            </th>
            <th scope="col" className="wl-attend-manage__th">
              Detail
            </th>
          </tr>
        </thead>
        <tbody>
          {shows.length === 0 ?
            <tr>
              <td className="wl-attend-manage__empty" colSpan={6}>
                {emptyMsg}
              </td>
            </tr>
          : shows.map((show) => (
              <tr key={show.show_id}>
                <td className="wl-attend-manage__td wl-attend-manage__td--center">
                  <button
                    type="button"
                    className={cn(
                      "wl-attend-manage__check",
                      show.attended ?
                        "wl-attend-manage__check--on"
                      : "wl-attend-manage__check--off",
                    )}
                    onClick={() => onAttendanceToggle(show)}
                    title={
                      show.attended
                        ? "Remove from attended shows"
                        : "Mark as attended"
                    }
                    aria-pressed={show.attended}
                    aria-label={
                      show.attended
                        ? `Remove ${formatShowDate(show.show_date)} from attended`
                        : `Mark ${formatShowDate(show.show_date)} as attended`
                    }
                  >
                    <Check
                      className="wl-attend-manage__check-icon"
                      aria-hidden
                    />
                  </button>
                </td>
                <td className="wl-attend-manage__td wl-attend-manage__td--center">
                  <Link
                    href={getSetlistArchiveUrl(show.show_id)}
                    className="wl-attend-manage__link--emphasis"
                  >
                    {formatShowDate(show.show_date)}
                  </Link>
                </td>
                <td className="wl-attend-manage__td">{show.show_group}</td>
                <td className="wl-attend-manage__td">
                  {show.venue_id ?
                    <Link
                      href={getVenueArchiveUrl(show.venue_id)}
                      className="wl-attend-manage__link--emphasis"
                    >
                      {show.show_subvenue}
                    </Link>
                  : show.show_subvenue_venue ?
                    <Link
                      href={getVenueArchiveUrl(show.show_subvenue_venue)}
                      className="wl-attend-manage__link--emphasis"
                    >
                      {show.show_subvenue}
                    </Link>
                  : show.show_subvenue}
                </td>
                <td className="wl-attend-manage__td">
                  {show.show_venue_location}
                </td>
                <td className="wl-attend-manage__td">
                  {show.show_detail}
                  {show.show_detail && show.show_alert ? " " : null}
                  {show.show_alert ?
                    <span className="wl-attend-manage__alert">
                      [{show.show_alert}]
                    </span>
                  : null}
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  )
}
