"use client"

import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"
import Link from "next/link"
import { ArrowUp, ArrowDown } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { formatSetlistDate } from "@/lib/setlist-utils"
import { cn } from "@/lib/utils"
import type { GuestShow } from "@/hooks/use-guest-data"
import { useIsDesktopContentLayout } from "@/hooks/use-mobile"
import { SETLIST_V2_ROW_TOOLTIP_CONTENT } from "@/components/wl-home-v2/wl-home-v2-setlist-table.constants"

interface GuestPerformanceTableViewProps {
  performances: GuestShow[]
  sortColumn: string
  sortDirection: "asc" | "desc"
  handleSort: (column: string) => void
  selectedGroup: string | null
  /** WL Home personnel: verbatim `perf-table` chrome from `/archive/song`. */
  wlHomeV2?: boolean
}

function SortIcon({
  column,
  sortColumn,
  sortDirection,
}: {
  column: string
  sortColumn: string
  sortDirection: "asc" | "desc"
}) {
  if (sortColumn !== column) return null
  return sortDirection === "asc" ? (
    <ArrowUp className="size-3.5 inline-block ml-0.5" />
  ) : (
    <ArrowDown className="size-3.5 inline-block ml-0.5" />
  )
}

function guestVenueHref(perf: GuestShow): string | null {
  if (perf.venue_id) return getVenueArchiveUrl(perf.venue_id)
  if (perf.show_subvenue) return getVenueArchiveUrl(perf.show_subvenue)
  if (perf.show_venue_location)
    return getVenueArchiveUrl(perf.show_venue_location)
  return null
}

function GuestWlHomeV2PerfTableRow({
  perf,
  selectedGroup,
  showTooltips,
}: {
  perf: GuestShow
  selectedGroup: string | null
  showTooltips: boolean
}) {
  const shouldHighlight = Boolean(
    selectedGroup && perf.show_group === selectedGroup,
  )
  const shouldMute = Boolean(
    selectedGroup && perf.show_group !== selectedGroup,
  )
  const venueHref = guestVenueHref(perf)
  const dateLink = (
    <Link href={getSetlistArchiveUrl(perf.show_id)}>
      {formatSetlistDate(perf.show_date)}
    </Link>
  )

  return (
    <tr
      className={
        shouldHighlight ? "perf-table-row--hl"
        : shouldMute ? "perf-table-row--muted"
        : ""
      }
    >
      <td className="date perf-table-td--show">
        {showTooltips ?
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>{dateLink}</TooltipTrigger>
            <TooltipContent {...SETLIST_V2_ROW_TOOLTIP_CONTENT}>
              <div className="wl-home-v2-setlist-song-spread-tooltip-inner text-left text-xs">
                <p className="wl-home-v2-setlist-song-spread-tooltip-title">
                  {formatSetlistDate(perf.show_date)}
                </p>
                <p className="leading-snug">{perf.show_group}</p>
                <p className="text-white/70">{perf.show_venue_location}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        : dateLink}
      </td>
      <td className="dim">{perf.show_group}</td>
      <td className="venue">
        {perf.show_subvenue ?
          showTooltips ?
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                {venueHref ?
                  <Link href={venueHref}>{perf.show_venue_location}</Link>
                : <span>{perf.show_venue_location}</span>}
              </TooltipTrigger>
              <TooltipContent
                {...SETLIST_V2_ROW_TOOLTIP_CONTENT}
                className={cn(
                  SETLIST_V2_ROW_TOOLTIP_CONTENT.className,
                  "setlist-header-tooltip--tight",
                )}
              >
                <div
                  className="[&_a]:text-primary [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: perf.show_subvenue }}
                />
              </TooltipContent>
            </Tooltip>
          : venueHref ?
            <Link href={venueHref}>{perf.show_venue_location}</Link>
          : perf.show_venue_location
        : venueHref ?
          <Link href={venueHref}>{perf.show_venue_location}</Link>
        : perf.show_venue_location}
      </td>
    </tr>
  )
}

function GuestWlHomeV2PerfTable({
  performances,
  sortColumn,
  handleSort,
  selectedGroup,
}: Pick<
  GuestPerformanceTableViewProps,
  "performances" | "sortColumn" | "handleSort" | "selectedGroup"
>) {
  const showTooltips = useIsDesktopContentLayout()

  return (
    <div className="perf-table-wrap">
      <table className="perf-table">
        <thead>
          <tr>
            <th
              className={
                sortColumn === "show_date" ? "active perf-table-th--center" : (
                  "perf-table-th--center"
                )
              }
              onClick={() => handleSort("show_date")}
            >
              Show
            </th>
            <th
              className={sortColumn === "show_group" ? "active" : ""}
              onClick={() => handleSort("show_group")}
            >
              Group
            </th>
            <th
              className={
                sortColumn === "show_venue_location" ? "active" : ""
              }
              onClick={() => handleSort("show_venue_location")}
            >
              Location
            </th>
          </tr>
        </thead>
        <tbody>
          {performances.map((perf, index) => (
            <GuestWlHomeV2PerfTableRow
              key={`${perf.show_id}-${index}`}
              perf={perf}
              selectedGroup={selectedGroup}
              showTooltips={showTooltips}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function GuestPerformanceTableView({
  performances,
  sortColumn,
  sortDirection,
  handleSort,
  selectedGroup,
  wlHomeV2 = false,
}: GuestPerformanceTableViewProps) {
  if (wlHomeV2) {
    return (
      <GuestWlHomeV2PerfTable
        performances={performances}
        sortColumn={sortColumn}
        handleSort={handleSort}
        selectedGroup={selectedGroup}
      />
    )
  }

  const shouldHighlight = (perf: GuestShow) => {
    if (!selectedGroup) return true
    return perf.show_group === selectedGroup
  }

  const getVenueHref = (perf: GuestShow) => {
    if (perf.venue_id) return getVenueArchiveUrl(perf.venue_id)
    if (perf.show_subvenue) return getVenueArchiveUrl(perf.show_subvenue)
    if (perf.show_venue_location)
      return getVenueArchiveUrl(perf.show_venue_location)
    return null
  }

  const cellPadding = "px-2 py-1"

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead
              className="cursor-pointer hover:bg-muted/60 text-xs text-center"
              onClick={() => handleSort("show_date")}
            >
              Show{" "}
              <SortIcon
                column="show_date"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
              />
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/60 text-xs"
              onClick={() => handleSort("show_group")}
            >
              Group{" "}
              <SortIcon
                column="show_group"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
              />
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/60 text-xs"
              onClick={() => handleSort("show_venue_location")}
            >
              Location{" "}
              <SortIcon
                column="show_venue_location"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {performances.map((perf) => {
            const isHighlighted = shouldHighlight(perf)
            const venueHref = getVenueHref(perf)

            return (
              <TableRow
                key={perf.show_id}
                className={`transition-colors ${
                  isHighlighted ? "bg-muted/60" : ""
                } ${selectedGroup && !isHighlighted ? "opacity-30" : "opacity-100"}`}
              >
                <TableCell
                  className={`text-xs whitespace-nowrap text-center ${cellPadding}`}
                >
                  <Link
                    href={getSetlistArchiveUrl(perf.show_id)}
                    className="font-medium hover:underline"
                  >
                    {formatSetlistDate(perf.show_date)}
                  </Link>
                </TableCell>
                <TableCell className={`text-xs whitespace-nowrap ${cellPadding}`}>
                  {perf.show_group}
                </TableCell>
                <TableCell className={`text-xs whitespace-nowrap ${cellPadding}`}>
                  {venueHref ? (
                    <Link href={venueHref} className="hover:underline">
                      {perf.show_venue_location}
                    </Link>
                  ) : (
                    perf.show_venue_location
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
