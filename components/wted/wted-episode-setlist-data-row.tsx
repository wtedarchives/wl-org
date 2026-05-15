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
import { SETLIST_V2_ROW_TOOLTIP_CONTENT } from "@/components/wl-home-v2/wl-home-v2-setlist-table.constants"
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
  wlHomeV2SetlistChrome: wl,
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
  wlHomeV2SetlistChrome?: boolean
}) {
  const [guestsTruncCollapsed, setGuestsTruncCollapsed] = useState(false)
  const [coachTruncCollapsed, setCoachTruncCollapsed] = useState(false)
  const sl = row.setlistEntry
  const pxPad = DISPLAY_SETLIST_TABLE_CELL_PAD
  const personnelMw = wl ? "max-w-[400px]" : "max-w-[300px]"
  const personnelMeasure = cn("w-max", personnelMw)
  const coachMw = wl ? "max-w-[400px]" : "max-w-[400px]"

  const linkArchiveClass =
    wl ?
      "font-semibold text-[var(--wl-orange)] hover:underline"
    : undefined

  return (
    <TableRow
      className={cn(
        wl ?
          cn(
            "song-row border-0",
            shouldHighlightRow && "song-row--release-highlight",
            shouldDimRow && "song-row--release-dim",
          )
        : cn(
            "border-border/60 transition-opacity",
            shouldHighlightRow && "bg-primary/20",
            shouldDimRow && "opacity-10",
          ),
      )}
    >
      <TableCell
        className={cn(
          pxPad,
          wl ?
            cn(
              "num-cell text-center tabular-nums",
              !numberUsesPlacementColor && "num-cell--no-placement-bar",
            )
          : cn(
              "display-setlist-num-cell text-center tabular-nums",
              numberUsesPlacementColor ? "text-white" : "text-muted-foreground",
            ),
        )}
        {...(!wl && numberUsesPlacementColor && placementToken !== "none" ?
          { "data-placement-bar": placementToken }
        : {})}
      >
        {wl && numberUsesPlacementColor ?
          <span className="bar" data-placement-bar={placementToken} />
        : null}
        <span className="inline-block cursor-default">{displayNum}</span>
      </TableCell>
      <TableCell
        className={cn(pxPad, wl ? "align-middle song-cell" : "align-top")}
      >
        <SetlistEntrySongCell
          entry={sl}
          onSongClick={(entry) => router.push(getSongArchiveUrl(entry.song_id))}
          onJotyClick={onJotyClick}
          showStatsTooltip={isDesktop && !wl}
          statsTooltipWlV2Chrome={!!wl}
        />
      </TableCell>
      <TableCell
        className={cn(
          pxPad,
          wl ?
            "center tour-cell tabular-nums"
          : "whitespace-nowrap text-center tabular-nums text-muted-foreground",
        )}
      >
        {row.showDate && row.showId ?
          <Link
            href={getSetlistArchiveUrl(row.showId)}
            className={cn(
              wl ? linkArchiveClass : "font-medium text-foreground hover:underline",
            )}
          >
            {formatSetlistDate(row.showDate)}
          </Link>
        : row.showDate ?
          formatSetlistDate(row.showDate)
        : ""}
      </TableCell>
      <TableCell
        className={cn(
          pxPad,
          wl ?
            "align-top text-[13px] text-white/65 whitespace-nowrap"
          : "whitespace-nowrap text-muted-foreground",
        )}
      >
        {row.venueLocation ?
          row.venueId ?
            <Link
              href={getVenueArchiveUrl(row.venueId)}
              className={cn(
                wl ? linkArchiveClass : "font-normal text-foreground hover:underline",
              )}
            >
              {row.venueLocation}
            </Link>
          : row.venueLocation
        : ""}
      </TableCell>
      {showWtedColumn ?
        <TableCell
          className={cn(pxPad, wl ? "center" : "text-center")}
        >
          <SetlistEntryWtedCell
            entry={sl}
            onWtedClick={onWtedClick}
            showTooltips={isDesktop}
            tooltipContentClassName={
              wl ? SETLIST_V2_ROW_TOOLTIP_CONTENT.className : undefined
            }
          />
        </TableCell>
      : null}
      <TableCell
        className={cn(
          pxPad,
          wl ? "center time-cell tabular-nums" : "text-center tabular-nums text-muted-foreground",
        )}
      >
        {formatEntryLength(sl.entry_length) ?? ""}
      </TableCell>
      {showGroupColumn ?
        <TableCell
          className={cn(
            pxPad,
            wl ? "center tour-cell" : "text-center text-muted-foreground",
          )}
        >
          {row.showGroup ?? ""}
        </TableCell>
      : null}
      <TableCell
        className={cn(
          pxPad,
          wl ?
            cn(
              "personnel-cell",
              personnelMw,
              guestsTruncCollapsed ? "align-middle" : "align-top",
            )
          : cn(
              "w-max max-w-[300px]",
              guestsTruncCollapsed ? "align-middle" : "align-top",
            ),
        )}
      >
        {sl.guests?.length ?
          <SetlistTruncatableCell
            maxWidthClass={personnelMw}
            measureWidthClass={personnelMeasure}
            measureKey={`${sl.entry_id}-guests`}
            expandLabel="Show all personnel"
            onTruncatedCollapsedChange={setGuestsTruncCollapsed}
          >
            <SetlistEntryGuestsCell
              entry={sl}
              showTooltips={isDesktop}
              nowrap={false}
              useWlHomeV2PillStyle={!!wl}
              tooltipContentClassName={
                wl ? SETLIST_V2_ROW_TOOLTIP_CONTENT.className : undefined
              }
            />
          </SetlistTruncatableCell>
        : null}
      </TableCell>
      <TableCell
        className={cn(
          pxPad,
          wl ?
            cn(
              "notes-cell",
              coachMw,
              coachTruncCollapsed ? "align-middle" : "align-top",
            )
          : cn(
              "w-max max-w-[400px] py-[1px]",
              coachTruncCollapsed ? "align-middle" : "align-top",
            ),
        )}
      >
        {sl.entry_coachnotes?.trim() ?
          <SetlistTruncatableHtmlCell
            maxWidthClass={coachMw}
            measureWidthClass={cn("w-max", coachMw)}
            measureKey={`${sl.entry_id}-coach`}
            html={sl.entry_coachnotes.trim()}
            expandLabel="Show full coach notes"
            htmlContentClassName={wl ? "setlist-v2-notes-html" : undefined}
            blockPlainClassName={wl ? "setlist-v2-notes-plain" : undefined}
            onTruncatedCollapsedChange={setCoachTruncCollapsed}
          />
        : null}
      </TableCell>
    </TableRow>
  )
}
