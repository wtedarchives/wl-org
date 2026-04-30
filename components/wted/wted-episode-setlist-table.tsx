"use client"

import { useState, type ReactNode } from "react"
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
import {
  DISPLAY_SETLIST_TABLE_CELL_PAD,
} from "@/components/dpro/setlist/display-setlist-table.constants"
import { getPlacementBarCssToken } from "@/lib/placement-bar-color"
import {
  formatEntryLength,
  formatSetlistDate,
  getEncoreLabel,
  shouldShowSetBreak,
} from "@/lib/setlist-utils"
import {
  SetlistTruncatableCell,
  SetlistTruncatableHtmlCell,
} from "@/components/dpro/setlist/setlist-truncatable-cell"
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

import "@/components/dpro/setlist/display-setlist-table.css"
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
      <TableHead
        className={cn(
          "h-8 w-4 shrink-0 text-center text-muted-foreground",
          DISPLAY_SETLIST_TABLE_CELL_PAD,
        )}
      >
        #
      </TableHead>
      <TableHead
        className={cn("h-8 text-muted-foreground", DISPLAY_SETLIST_TABLE_CELL_PAD)}
      >
        Song
      </TableHead>
      <TableHead
        className={cn(
          "h-8 whitespace-nowrap text-center text-muted-foreground",
          DISPLAY_SETLIST_TABLE_CELL_PAD,
        )}
      >
        Date
      </TableHead>
      <TableHead
        className={cn("h-8 text-muted-foreground", DISPLAY_SETLIST_TABLE_CELL_PAD)}
      >
        Location
      </TableHead>
      {showWtedColumn ?
        <TableHead
          className={cn(
            "h-8 text-center text-muted-foreground",
            DISPLAY_SETLIST_TABLE_CELL_PAD,
          )}
        >
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
      <TableHead
        className={cn(
          "h-8 text-center text-muted-foreground",
          DISPLAY_SETLIST_TABLE_CELL_PAD,
        )}
      >
        Time
      </TableHead>
      {showGroupColumn ?
        <TableHead
          className={cn(
            "h-8 text-center text-muted-foreground",
            DISPLAY_SETLIST_TABLE_CELL_PAD,
          )}
        >
          Group
        </TableHead>
      : null}
      <TableHead
        className={cn(
          "h-8 w-max max-w-[300px] text-muted-foreground",
          DISPLAY_SETLIST_TABLE_CELL_PAD,
        )}
      >
        Personnel
      </TableHead>
      <TableHead
        className={cn(
          "h-8 w-max max-w-[400px] text-muted-foreground",
          DISPLAY_SETLIST_TABLE_CELL_PAD,
          "py-[1px]",
        )}
      >
        Coach&apos;s Notes
      </TableHead>
    </TableRow>
  )
}

function WtedEpisodeSetlistDataRow({
  row,
  displayNum,
  placementToken,
  numberUsesPlacementColor,
  shouldHighlightRow,
  shouldDimRow,
  router,
  isDesktop,
  showWtedColumn,
  showGroupColumn,
  onWtedClick,
  onJotyClick,
}: {
  row: WtedEpisodeTableRow
  displayNum: number
  placementToken: ReturnType<typeof getPlacementBarCssToken>
  numberUsesPlacementColor: boolean
  shouldHighlightRow: boolean
  shouldDimRow: boolean
  router: ReturnType<typeof useRouter>
  isDesktop: boolean
  showWtedColumn: boolean
  showGroupColumn: boolean
  onWtedClick?: (entry: SetlistEntry) => void
  onJotyClick?: (entry: SetlistEntry) => void
}) {
  const [guestsTruncCollapsed, setGuestsTruncCollapsed] = useState(false)
  const [coachTruncCollapsed, setCoachTruncCollapsed] = useState(false)
  const sl = row.setlistEntry

  return (
    <TableRow
      className={cn(
        "border-border/60 transition-opacity",
        shouldHighlightRow && "bg-primary/20",
        shouldDimRow && "opacity-10",
      )}
    >
      <TableCell
        className={cn(
          DISPLAY_SETLIST_TABLE_CELL_PAD,
          "display-setlist-num-cell text-center tabular-nums",
          numberUsesPlacementColor ? "text-white" : "text-muted-foreground",
        )}
        data-placement-bar={
          numberUsesPlacementColor && placementToken !== "none"
            ? placementToken
            : undefined
        }
      >
        {displayNum}
      </TableCell>
      <TableCell className={cn(DISPLAY_SETLIST_TABLE_CELL_PAD, "align-top")}>
        <SetlistEntrySongCell
          entry={sl}
          onSongClick={(entry) => router.push(getSongArchiveUrl(entry.song_id))}
          onJotyClick={onJotyClick}
        />
      </TableCell>
      <TableCell
        className={cn(
          DISPLAY_SETLIST_TABLE_CELL_PAD,
          "whitespace-nowrap text-center tabular-nums text-muted-foreground",
        )}
      >
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
      <TableCell
        className={cn(DISPLAY_SETLIST_TABLE_CELL_PAD, "whitespace-nowrap text-muted-foreground")}
      >
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
        <TableCell className={cn(DISPLAY_SETLIST_TABLE_CELL_PAD, "text-center")}>
          <SetlistEntryWtedCell
            entry={sl}
            onWtedClick={onWtedClick}
            showTooltips={isDesktop}
          />
        </TableCell>
      : null}
      <TableCell
        className={cn(
          DISPLAY_SETLIST_TABLE_CELL_PAD,
          "text-center tabular-nums text-muted-foreground",
        )}
      >
        {formatEntryLength(sl.entry_length) ?? ""}
      </TableCell>
      {showGroupColumn ?
        <TableCell
          className={cn(
            DISPLAY_SETLIST_TABLE_CELL_PAD,
            "text-center text-muted-foreground",
          )}
        >
          {row.showGroup ?? ""}
        </TableCell>
      : null}
      <TableCell
        className={cn(
          DISPLAY_SETLIST_TABLE_CELL_PAD,
          "w-max max-w-[300px]",
          guestsTruncCollapsed ? "align-middle" : "align-top",
        )}
      >
        {sl.guests?.length ?
          <SetlistTruncatableCell
            maxWidthClass="max-w-[300px]"
            measureWidthClass="w-max max-w-[300px]"
            measureKey={`${sl.entry_id}-guests`}
            expandLabel="Show all personnel"
            onTruncatedCollapsedChange={setGuestsTruncCollapsed}
          >
            <SetlistEntryGuestsCell entry={sl} showTooltips={isDesktop} />
          </SetlistTruncatableCell>
        : null}
      </TableCell>
      <TableCell
        className={cn(
          DISPLAY_SETLIST_TABLE_CELL_PAD,
          "w-max max-w-[400px] py-[1px]",
          coachTruncCollapsed ? "align-middle" : "align-top",
        )}
      >
        {sl.entry_coachnotes?.trim() ?
          <SetlistTruncatableHtmlCell
            maxWidthClass="max-w-[400px]"
            measureWidthClass="w-max max-w-[400px]"
            measureKey={`${sl.entry_id}-coach`}
            html={sl.entry_coachnotes.trim()}
            expandLabel="Show full coach notes"
            onTruncatedCollapsedChange={setCoachTruncCollapsed}
          />
        : null}
      </TableCell>
    </TableRow>
  )
}

export function WtedEpisodeSetlistTable({
  rows,
  hoveredCategory = null,
  hoveredPerformanceYear = null,
  hoveredShowGroupKey = null,
  onWtedClick,
  onJotyClick,
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
  /** Opens the same JOTY drawer as the setlist archive page. */
  onJotyClick?: (entry: SetlistEntry) => void
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
    7 + (showWtedColumn ? 1 : 0) + (showGroupColumn ? 1 : 0)

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
                className="border-y border-border bg-gray-700 px-0 py-[2px] text-center text-[0.625rem] font-medium text-foreground"
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
              className="border-y border-border bg-gray-800 px-0 py-[2px] text-center text-[0.625rem] font-medium text-foreground"
            >
              Set Break
            </TableCell>
          </TableRow>,
        )
      }
    }

    displayNum += 1
    const placementToken = getPlacementBarCssToken(row.wtedPlacement ?? null)
    const numberUsesPlacementColor = placementToken !== "none"
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
      <WtedEpisodeSetlistDataRow
        key={row.refId}
        row={row}
        displayNum={displayNum}
        placementToken={placementToken}
        numberUsesPlacementColor={numberUsesPlacementColor}
        shouldHighlightRow={shouldHighlightRow}
        shouldDimRow={shouldDimRow}
        router={router}
        isDesktop={isDesktop}
        showWtedColumn={showWtedColumn}
        showGroupColumn={showGroupColumn}
        onWtedClick={onWtedClick}
        onJotyClick={onJotyClick}
      />,
    )
  })

  return (
    <TooltipProvider delayDuration={0}>
      <div className="w-full overflow-x-auto">
        <Table className="display-setlist-table">
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
