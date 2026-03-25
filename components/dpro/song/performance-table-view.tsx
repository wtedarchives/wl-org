"use client"


import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import Link from "next/link"
import { formatSetlistDate } from "@/lib/setlist-utils"
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
import {
  PLACEMENT_COLORS,
  formatPerformanceLength,
} from "@/lib/song-performance-utils"
import { getJotyBadgeStyle } from "@/components/dpro/setlist/display-setlist-table.constants"
import { PerformanceTooltipContent } from "./performance-tooltip"
import type { SongPerformance } from "@/types/song"

interface PerformanceTableViewProps {
  performances: SongPerformance[]
  sortColumn: string
  sortDirection: "asc" | "desc"
  handleSort: (column: string) => void
  selectedGroup: string | null
  onJOTYClick?: (year: number, entryId: string | null) => void
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

export function PerformanceTableView({
  performances,
  sortColumn,
  sortDirection,
  handleSort,
  selectedGroup,
  onJOTYClick,
}: PerformanceTableViewProps) {
  const shouldHighlight = (perf: SongPerformance) => {
    if (!selectedGroup) return false
    return perf.show_group === selectedGroup
  }

  const getVenueHref = (perf: SongPerformance) => {
    if (perf.venue_id) return `/archive/venue/${perf.venue_id}`
    if (perf.show_subvenue_venue)
      return `/archive/venue/${encodeURIComponent(perf.show_subvenue_venue)}`
    const venueSearchTerm = perf.show_subvenue || perf.show_venue_location
    if (venueSearchTerm)
      return `/archive/venue/${encodeURIComponent(venueSearchTerm)}`
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
              Show <SortIcon column="show_date" sortColumn={sortColumn} sortDirection={sortDirection} />
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/60 text-xs"
              onClick={() => handleSort("show_group")}
            >
              Group <SortIcon column="show_group" sortColumn={sortColumn} sortDirection={sortDirection} />
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/60 text-xs"
              onClick={() => handleSort("show_venue_location")}
            >
              Location <SortIcon column="show_venue_location" sortColumn={sortColumn} sortDirection={sortDirection} />
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/60 text-xs"
              onClick={() => handleSort("entry_song")}
            >
              Song <SortIcon column="entry_song" sortColumn={sortColumn} sortDirection={sortDirection} />
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/60 text-xs text-center"
              onClick={() => handleSort("entry_set")}
            >
              Set <SortIcon column="entry_set" sortColumn={sortColumn} sortDirection={sortDirection} />
            </TableHead>
            <TableHead className="text-xs text-center">JOTY</TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/60 text-xs text-center"
              onClick={() => handleSort("gap")}
            >
              Gap <SortIcon column="gap" sortColumn={sortColumn} sortDirection={sortDirection} />
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/60 text-xs text-center"
              onClick={() => handleSort("entry_length")}
            >
              Length <SortIcon column="entry_length" sortColumn={sortColumn} sortDirection={sortDirection} />
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/60 text-xs"
              onClick={() => handleSort("entry_coachnotes")}
            >
              Coach&apos;s Notes
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {performances.map((perf, index) => {
            const isHighlighted = shouldHighlight(perf)
            const venueHref = getVenueHref(perf)
            const isMainSet = perf.entry_placement?.startsWith("Main Set ")
            const placementBg =
              isMainSet ? undefined : PLACEMENT_COLORS[perf.entry_placement]

            return (
              <TableRow
                key={`${perf.show_id}-${index}`}
                className={`transition-colors ${
                  isHighlighted ? "bg-muted/60" : ""
                } ${selectedGroup && !isHighlighted ? "opacity-30" : "opacity-100"}`}
              >
                <TableCell
                  className={`text-xs whitespace-nowrap text-center ${cellPadding}`}
                  style={{
                    boxShadow: placementBg
                      ? `inset -4px 0 0 ${placementBg}`
                      : "none",
                  }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={getSetlistArchiveUrl(perf.show_id)}
                        className="font-medium hover:underline"
                      >
                        {formatSetlistDate(perf.show_date)}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <PerformanceTooltipContent fullData={perf} />
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className={`text-xs whitespace-nowrap ${cellPadding}`}>
                  {perf.show_group}
                </TableCell>
                <TableCell className={`text-xs whitespace-nowrap ${cellPadding}`}>
                  {perf.show_subvenue ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {venueHref ? (
                          <Link
                            href={venueHref}
                            className="hover:underline"
                          >
                            {perf.show_venue_location}
                          </Link>
                        ) : (
                          <span>{perf.show_venue_location}</span>
                        )}
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[250px]">
                        <div
                          className="text-xs [&_a]:text-primary [&_a]:underline"
                          dangerouslySetInnerHTML={{ __html: perf.show_subvenue }}
                        />
                      </TooltipContent>
                    </Tooltip>
                  ) : venueHref ? (
                    <Link
                      href={venueHref}
                      className="hover:underline"
                    >
                      {perf.show_venue_location}
                    </Link>
                  ) : (
                    perf.show_venue_location
                  )}
                </TableCell>
                <TableCell className={`text-xs ${cellPadding}`}>
                  {perf.entry_song && perf.entry_song !== ">" ? (
                    <span>
                      <span className="font-medium mr-2">{perf.entry_song}</span>
                      {perf.entry_short && (
                        <span className="text-destructive mr-2">
                          [{perf.entry_short}]
                        </span>
                      )}
                      {perf.entry_segue && (
                        <span className="text-destructive">→</span>
                      )}
                    </span>
                  ) : (
                    <Link
                      href={getSetlistArchiveUrl(perf.show_id)}
                      className="text-destructive hover:underline"
                    >
                      &gt;
                    </Link>
                  )}
                </TableCell>
                <TableCell className={`text-xs text-center whitespace-nowrap ${cellPadding}`}>
                  {perf.entry_set || ""}
                </TableCell>
                <TableCell className={`text-xs text-center whitespace-nowrap ${cellPadding}`}>
                  {perf.joty_round && (() => {
                    const jotyStyle = getJotyBadgeStyle(perf.joty_round)
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          const year = new Date(perf.show_date).getFullYear()
                          if (onJOTYClick) {
                            onJOTYClick(year, perf.entry_id ?? null)
                          } else {
                            window.location.href = "https://jotyoftheyear.com"
                          }
                        }}
                        className="cursor-pointer transition-transform hover:scale-110"
                      >
                        <span
                          style={jotyStyle.style}
                          className={`${jotyStyle.className} cursor-pointer`}
                        >
                          {perf.joty_round}
                        </span>
                      </button>
                    )
                  })()}
                </TableCell>
                <TableCell className={`text-xs text-center whitespace-nowrap ${cellPadding}`}>
                  {perf.gap !== null && perf.gap !== undefined ? (
                    perf.gap === "Debut" ? (
                      <span className="font-medium text-emerald-600">
                        Debut
                      </span>
                    ) : (
                      String(perf.gap)
                    )
                  ) : (
                    ""
                  )}
                </TableCell>
                <TableCell className={`text-xs text-center whitespace-nowrap ${cellPadding}`}>
                  {perf.entry_length
                    ? formatPerformanceLength(perf.entry_length)
                    : ""}
                </TableCell>
                <TableCell className={`text-xs ${cellPadding}`}>
                  {perf.entry_coachnotes ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: perf.entry_coachnotes,
                      }}
                    />
                  ) : (
                    ""
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
