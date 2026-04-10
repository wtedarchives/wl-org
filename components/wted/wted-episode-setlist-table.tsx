"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { WtedEpisodeTableRow } from "@/types/wted-episode"
import { getPlacementIndexCellBg } from "@/components/dpro/setlist/display-setlist-table.constants"
import {
  formatEntryLength,
  formatSetlistDate,
  getEncoreLabel,
  shouldShowSetBreak,
} from "@/lib/setlist-utils"
import { SetlistEntryGuestsCell } from "@/components/dpro/setlist/setlist-entry-guests-cell"
import { SetlistEntrySongCell } from "@/components/dpro/setlist/setlist-entry-song-cell"
import { SetlistEntryWtedCell } from "@/components/dpro/setlist/setlist-entry-wted-cell"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { SetlistEntry } from "@/types/setlist"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"
import { wtedEpisodeShowGroupKey } from "@/lib/wted-episode-show-group"
import { cn } from "@/lib/utils"
import { useIsDesktopContentLayout } from "@/hooks/use-mobile"

function WtedEpisodeSetlistTableHead({
  showGroupColumn,
  showWtedColumn,
  isDesktop,
}: {
  showGroupColumn: boolean
  showWtedColumn: boolean
  isDesktop: boolean
}) {
  return (
    <TableRow className="h-8 border-border/60 hover:bg-transparent">
      <TableHead className="h-8 w-4 shrink-0 text-center text-muted-foreground">
        #
      </TableHead>
      <TableHead className="h-8 max-w-[470px] text-muted-foreground">
        Song
      </TableHead>
      <TableHead className="h-8 whitespace-nowrap text-center text-muted-foreground">
        Date
      </TableHead>
      <TableHead className="h-8 text-muted-foreground">Location</TableHead>
      {showWtedColumn ?
        <TableHead className="h-8 text-center text-muted-foreground">
          {isDesktop ?
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">WTED</span>
              </TooltipTrigger>
              <TooltipContent>
                Use the icons below to request songs on WTED Goose Radio.
              </TooltipContent>
            </Tooltip>
          : "WTED"}
        </TableHead>
      : null}
      <TableHead className="h-8 text-center text-muted-foreground">
        Time
      </TableHead>
      {showGroupColumn ?
        <TableHead className="h-8 text-center text-muted-foreground">
          Group
        </TableHead>
      : null}
      <TableHead className="h-8 min-w-[400px] max-w-[600px] text-muted-foreground">
        Personnel
      </TableHead>
    </TableRow>
  )
}

export function WtedEpisodeSetlistTable({
  rows,
  hoveredCategory = null,
  hoveredPerformanceYear = null,
  hoveredShowGroupKey = null,
  onWtedClick,
}: {
  rows: WtedEpisodeTableRow[]
  /** When set, highlights matching song categories and dims others (song spread hover). */
  hoveredCategory?: string | null
  /** When set, highlights rows whose adjoining show date is in this year (performance spread hover). */
  hoveredPerformanceYear?: string | null
  /** When set, highlights rows whose adjoining show matches this normalized `show_group` (group spread hover). */
  hoveredShowGroupKey?: string | null
  /** Opens WTED request sheet (logged in) or login dialog (guest). */
  onWtedClick?: (entry: SetlistEntry) => void
}) {
  const router = useRouter()
  const isDesktop = useIsDesktopContentLayout()
  const showGroupColumn = rows.some(
    (r) => r.showGroup != null && r.showGroup !== "Goose",
  )
  const showWtedColumn = rows.some((r) => !!r.setlistEntry.radio_id)

  const placements = new Set(
    rows.map((r) => r.wtedPlacement).filter((p): p is string => !!p?.length),
  )
  const hasSinglePlacementType = placements.size <= 1
  const colSpan =
    6 + (showWtedColumn ? 1 : 0) + (showGroupColumn ? 1 : 0)

  let displayNum = 0

  const body: ReactNode[] = []

  rows.forEach((row, index) => {
    const prev = index > 0 ? rows[index - 1] : null
    const sl = row.setlistEntry

    if (!hasSinglePlacementType && row.wtedSet) {
      if (prev && row.wtedSet.startsWith("E")) {
        if (
          !prev.wtedSet ||
          !prev.wtedSet.startsWith("E") ||
          prev.wtedSet !== row.wtedSet
        ) {
          body.push(
            <TableRow
              key={`encore-${row.refId}-${index}`}
              className="border-border/60 hover:bg-transparent"
            >
              <TableCell
                colSpan={colSpan}
                className="border-y border-border bg-gray-700 !px-0 !py-0.5 text-center text-[0.625rem] font-medium text-foreground"
              >
                {getEncoreLabel(row.wtedSet)}
              </TableCell>
            </TableRow>,
          )
        }
      }

      if (
        prev?.wtedSet &&
        row.wtedSet &&
        shouldShowSetBreak(prev.wtedSet, row.wtedSet)
      ) {
        body.push(
          <TableRow
            key={`setbreak-${row.refId}-${index}`}
            className="border-border/60 hover:bg-transparent"
          >
            <TableCell
              colSpan={colSpan}
              className="border-y border-border bg-gray-800 !px-0 !py-0.5 text-center text-[0.625rem] font-medium text-foreground"
            >
              Set Break
            </TableCell>
          </TableRow>,
        )
      }
    }

    displayNum += 1
    const indexCellBg = getPlacementIndexCellBg(row.wtedPlacement ?? null)
    const numberUsesPlacementColor = indexCellBg !== "transparent"
    const entryCategory =
      sl.song_category || sl.songs?.song_category || "undefined"
    const d = row.showDate?.trim()
    const yearPrefix = d && d.length >= 4 ? d.slice(0, 4) : ""
    const rowYear = /^\d{4}$/.test(yearPrefix) ? yearPrefix : null
    const yearMatches =
      !!hoveredPerformanceYear &&
      rowYear != null &&
      rowYear === hoveredPerformanceYear
    const rowGroupKey = wtedEpisodeShowGroupKey(row.showGroup)
    const groupMatches =
      !!hoveredShowGroupKey && rowGroupKey === hoveredShowGroupKey
    const categoryHighlight =
      !!hoveredCategory && entryCategory === hoveredCategory
    const shouldHighlightRow =
      categoryHighlight || yearMatches || groupMatches
    const categoryDim = !!hoveredCategory && !categoryHighlight
    const yearDim = !!hoveredPerformanceYear && !yearMatches
    const groupDim = !!hoveredShowGroupKey && !groupMatches
    const shouldDimRow = categoryDim || yearDim || groupDim

    body.push(
      <TableRow
        key={row.refId}
        className={cn(
          "border-border/60 transition-opacity",
          shouldHighlightRow && "bg-primary/20",
          shouldDimRow && "opacity-10",
        )}
      >
        <TableCell
          className={cn(
            "text-center tabular-nums",
            numberUsesPlacementColor ? "text-white" : "text-muted-foreground",
          )}
          style={{
            backgroundColor: numberUsesPlacementColor ?
                indexCellBg
              : undefined,
          }}
        >
          {displayNum}
        </TableCell>
        <TableCell className="max-w-[470px]">
          <SetlistEntrySongCell
            entry={sl}
            onSongClick={(entry) =>
              router.push(getSongArchiveUrl(entry.song_id))
            }
            showStatsTooltip={isDesktop}
          />
        </TableCell>
        <TableCell className="whitespace-nowrap text-center tabular-nums text-muted-foreground">
          {row.showDate && row.showId ?
            <Link
              href={getSetlistArchiveUrl(row.showId)}
              className="font-medium text-foreground hover:underline"
            >
              {formatSetlistDate(row.showDate)}
            </Link>
          : row.showDate ?
            formatSetlistDate(row.showDate)
          : ""}
        </TableCell>
        <TableCell className="whitespace-nowrap text-muted-foreground">
          {row.venueLocation ?
            row.venueId ?
              <Link
                href={getVenueArchiveUrl(row.venueId)}
                className="font-normal text-foreground hover:underline"
              >
                {row.venueLocation}
              </Link>
            : row.venueLocation
          : ""}
        </TableCell>
        {showWtedColumn ?
          <TableCell className="text-center">
            <SetlistEntryWtedCell
              entry={sl}
              onWtedClick={onWtedClick}
              showTooltips={isDesktop}
            />
          </TableCell>
        : null}
        <TableCell className="text-center tabular-nums text-muted-foreground">
          {formatEntryLength(sl.entry_length) ?? ""}
        </TableCell>
        {showGroupColumn ?
          <TableCell className="text-center text-muted-foreground">
            {row.showGroup ?? ""}
          </TableCell>
        : null}
        <TableCell className="min-w-[400px] max-w-[600px]">
          <SetlistEntryGuestsCell
            entry={sl}
            showTooltips={isDesktop}
          />
        </TableCell>
      </TableRow>,
    )
  })

  return (
    <TooltipProvider delayDuration={0}>
      <div className="w-full overflow-x-auto">
        <Table className="[&_th]:py-1 [&_th]:px-2 [&_th]:align-middle [&_td]:py-0.5 [&_td]:px-2 [&_td]:align-middle">
          <TableHeader>
            <WtedEpisodeSetlistTableHead
              showGroupColumn={showGroupColumn}
              showWtedColumn={showWtedColumn}
              isDesktop={isDesktop}
            />
          </TableHeader>
          <TableBody>{body}</TableBody>
        </Table>
      </div>
    </TooltipProvider>
  )
}
