"use client"

import Link from "next/link"
import { useState } from "react"

type NextAppRouter = ReturnType<
  typeof import("next/navigation").useRouter
>
import { TableCell, TableRow } from "@/components/ui/table"
import { DISPLAY_SETLIST_TABLE_CELL_PAD } from "@/components/dpro/setlist/display-setlist-table.constants"
import { getPlacementBarCssToken } from "@/lib/placement-bar-color"
import { formatEntryLength, formatSetlistDate } from "@/lib/setlist-utils"
import {
  SetlistTruncatableCell,
  SetlistTruncatableHtmlCell,
} from "@/components/dpro/setlist/setlist-truncatable-cell"
import { SetlistEntryGuestsCell } from "@/components/dpro/setlist/setlist-entry-guests-cell"
import { SetlistEntrySongCell } from "@/components/dpro/setlist/setlist-entry-song-cell"
import { SetlistEntryWtedCell } from "@/components/dpro/setlist/setlist-entry-wted-cell"
import type { SetlistEntry } from "@/types/setlist"
import type { WtedEpisodeTableRow } from "@/types/wted-episode"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"
import { cn } from "@/lib/utils"

export function WtedEpisodeSetlistDataRow({
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
  router: NextAppRouter
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
