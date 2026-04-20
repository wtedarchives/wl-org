"use client"

import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"
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
import { formatPerformanceLength } from "@/lib/song-performance-utils"
import { getPlacementBarColor } from "@/lib/placement-bar-color"
import {
  getJotyBadgeStyle,
  shouldShowSetlistEntryShort,
} from "@/components/dpro/setlist/display-setlist-table.constants"
import { PerformanceTooltipContent } from "./performance-tooltip"
import type { SongPerformance } from "@/types/song"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { useIsDesktopContentLayout } from "@/hooks/use-mobile"
import {
  SetlistTruncatableCell,
  SetlistTruncatableHtmlCell,
} from "@/components/dpro/setlist/setlist-truncatable-cell"
import { SetlistEntryGuestsCell } from "@/components/dpro/setlist/setlist-entry-guests-cell"

interface PerformanceTableViewProps {
  performances: SongPerformance[]
  sortColumn: string
  sortDirection: "asc" | "desc"
  handleSort: (column: string) => void
  selectedGroup: string | null
  onJOTYClick?: (year: number, entryId: string | null) => void
  /** Canonical song (songs.song) — performances are for this song. */
  songCanonical: string
  songDisplayName?: string | null
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

function PerformanceTableDataRow({
  perf,
  index,
  selectedGroup,
  songCanonical,
  songDisplayName,
  showTooltips,
  onJOTYClick,
}: {
  perf: SongPerformance
  index: number
  selectedGroup: string | null
  songCanonical: string
  songDisplayName?: string | null
  showTooltips: boolean
  onJOTYClick?: (year: number, entryId: string | null) => void
}) {
  const shouldHighlight =
    !!selectedGroup && perf.show_group === selectedGroup

  const getVenueHref = (p: SongPerformance) => {
    if (p.venue_id) return getVenueArchiveUrl(p.venue_id)
    if (p.show_subvenue_venue) return getVenueArchiveUrl(p.show_subvenue_venue)
    const venueSearchTerm = p.show_subvenue || p.show_venue_location
    if (venueSearchTerm) return getVenueArchiveUrl(venueSearchTerm)
    return null
  }

  const venueHref = getVenueHref(perf)
  const isMainSet = perf.entry_placement?.startsWith("Main Set ")
  const placementBg =
    isMainSet ? undefined : getPlacementBarColor(perf.entry_placement)
  const cellPadding = "px-2 py-1"
  const rowKey = perf.entry_id
    ? `${perf.entry_id}-${index}`
    : `${perf.show_id}-${index}`

  return (
    <TableRow
      className={`transition-colors ${
        shouldHighlight ? "bg-muted/60" : ""
      } ${selectedGroup && !shouldHighlight ? "opacity-30" : "opacity-100"}`}
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
                <Link href={venueHref} className="hover:underline">
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
          <Link href={venueHref} className="hover:underline">
            {perf.show_venue_location}
          </Link>
        ) : (
          perf.show_venue_location
        )}
      </TableCell>
      <TableCell className={`text-xs ${cellPadding}`}>
        {perf.entry_song && perf.entry_song !== ">" ? (
          <span>
            <span className="font-medium mr-2 inline">
              <SongDisplayName
                song={songCanonical}
                songDisplayName={songDisplayName}
              />
            </span>
            {shouldShowSetlistEntryShort(
              perf.entry_song ?? songCanonical,
              perf.entry_short,
            ) && (
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
      <TableCell
        className={`text-xs text-center whitespace-nowrap ${cellPadding}`}
      >
        {perf.entry_set || ""}
      </TableCell>
      <TableCell
        className={`text-xs text-center whitespace-nowrap ${cellPadding}`}
      >
        {perf.joty_round &&
          (() => {
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
      <TableCell
        className={`text-xs text-center whitespace-nowrap ${cellPadding}`}
      >
        {perf.gap !== null && perf.gap !== undefined ? (
          perf.gap === "Debut" ? (
            <span className="font-medium text-emerald-600">Debut</span>
          ) : (
            String(perf.gap)
          )
        ) : (
          ""
        )}
      </TableCell>
      <TableCell
        className={`text-xs text-center whitespace-nowrap ${cellPadding}`}
      >
        {perf.entry_length
          ? formatPerformanceLength(perf.entry_length)
          : ""}
      </TableCell>
      <TableCell
        className="w-max max-w-[300px] !py-0 align-middle whitespace-normal"
      >
        {perf.guests?.length ? (
          <SetlistTruncatableCell
            maxWidthClass="max-w-[300px]"
            measureWidthClass="w-max max-w-[300px]"
            measureKey={`${rowKey}-guests`}
            expandLabel="Show all personnel"
          >
            <SetlistEntryGuestsCell
              entry={{ guests: perf.guests }}
              showTooltips={showTooltips}
            />
          </SetlistTruncatableCell>
        ) : null}
      </TableCell>
      <TableCell
        className="w-max max-w-[400px] !py-0 align-middle whitespace-normal"
      >
        {perf.entry_coachnotes?.trim() ? (
          <SetlistTruncatableHtmlCell
            maxWidthClass="max-w-[400px]"
            measureWidthClass="w-max max-w-[400px]"
            measureKey={`${rowKey}-coach`}
            html={perf.entry_coachnotes.trim()}
            expandLabel="Show full coach notes"
          />
        ) : null}
      </TableCell>
    </TableRow>
  )
}

export function PerformanceTableView({
  performances,
  sortColumn,
  sortDirection,
  handleSort,
  selectedGroup,
  onJOTYClick,
  songCanonical,
  songDisplayName,
}: PerformanceTableViewProps) {
  const showTooltips = useIsDesktopContentLayout()

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
            <TableHead
              className="cursor-pointer hover:bg-muted/60 text-xs"
              onClick={() => handleSort("entry_song")}
            >
              Song{" "}
              <SortIcon
                column="entry_song"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
              />
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/60 text-xs text-center"
              onClick={() => handleSort("entry_set")}
            >
              Set{" "}
              <SortIcon
                column="entry_set"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
              />
            </TableHead>
            <TableHead className="text-xs text-center">JOTY</TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/60 text-xs text-center"
              onClick={() => handleSort("gap")}
            >
              Gap{" "}
              <SortIcon
                column="gap"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
              />
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/60 text-xs text-center"
              onClick={() => handleSort("entry_length")}
            >
              Length{" "}
              <SortIcon
                column="entry_length"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
              />
            </TableHead>
            <TableHead className="h-8 w-max max-w-[300px] text-xs text-muted-foreground">
              Personnel
            </TableHead>
            <TableHead className="h-8 w-max max-w-[400px] text-xs text-muted-foreground">
              Coach&apos;s Notes
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {performances.map((perf, index) => (
            <PerformanceTableDataRow
              key={
                perf.entry_id
                  ? `${perf.entry_id}-${index}`
                  : `${perf.show_id}-${index}`
              }
              perf={perf}
              index={index}
              selectedGroup={selectedGroup}
              songCanonical={songCanonical}
              songDisplayName={songDisplayName}
              showTooltips={showTooltips}
              onJOTYClick={onJOTYClick}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
