"use client"

import { useState, type CSSProperties } from "react"
import {
  TableCell,
  TableRow,
} from "@/components/ui/table"
import {
  getLastCountBadgeStyle,
  DISPLAY_SETLIST_TABLE_CELL_PAD,
} from "@/components/dpro/setlist/display-setlist-table.constants"
import {
  calculateRarity,
  formatEntryLength,
  getRarityColor,
  getRarityPillBackground,
} from "@/lib/setlist-utils"
import { cn } from "@/lib/utils"
import type {
  DiscographyShowColumnCell,
  GuestGroup,
  SetlistEntry,
} from "@/types/setlist"
import {
  SetlistTruncatableCell,
  SetlistTruncatableHtmlCell,
} from "@/components/dpro/setlist/setlist-truncatable-cell"
import { SetlistEntrySongCell } from "./setlist-entry-song-cell"
import { SetlistEntryNumberCell } from "./setlist-entry-number-cell"
import { SetlistEntryWtedCell } from "./setlist-entry-wted-cell"
import { SetlistEntryLastCell } from "./setlist-entry-last-cell"
import { SetlistEntryGuestsCell } from "./setlist-entry-guests-cell"
import { SetlistEntryDiscographyShowCell } from "@/components/dpro/setlist/setlist-entry-discography-show-cell"
import { getPlacementBarCssToken } from "@/lib/placement-bar-color"
import { SETLIST_V2_ROW_TOOLTIP_CONTENT } from "@/components/wl-home-v2/wl-home-v2-setlist-table.constants"

export interface SetlistEntryRowProps {
  entry: SetlistEntry
  displayNumber: number | null
  guestGroups: GuestGroup[]
  showCanonColumns: boolean
  showWtedColumn: boolean
  onWtedClick?: (entry: SetlistEntry) => void
  onSongClick?: (entry: SetlistEntry) => void
  onJotyClick?: (entry: SetlistEntry) => void
  copiedEntryIds?: Set<string>
  onNumberClick?: (entryId: string) => void
  showAdminUi?: boolean
  showTooltips?: boolean
  /** When true, row chrome matches WL v2 setlist `.song-row*` (underline `.set-table` hairlines). */
  wlHomeV2RowChrome?: boolean
  hoveredCategory?: string | null
  hoveredReleaseId?: string | null
  releaseToEntriesMap?: Record<string, Set<string>>
  /** When set (including `""`), extra Show column between Song and WTED (discography track listing). */
  discographySourceLabel?: string
  /** When set, # column omits placement bar colors (e.g. discography track listing). */
  suppressNumberPlacementColor?: boolean
  /** When set with object, Show column uses links; `null` is empty; omit to use label string only. */
  discographyShowCell?: DiscographyShowColumnCell | null
}

export function SetlistEntryRow({
  entry,
  displayNumber,
  guestGroups: _guestGroups,
  showCanonColumns,
  showWtedColumn,
  onWtedClick,
  onSongClick,
  onJotyClick,
  copiedEntryIds,
  onNumberClick,
  showAdminUi,
  showTooltips = true,
  hoveredCategory,
  hoveredReleaseId,
  releaseToEntriesMap,
  discographySourceLabel,
  suppressNumberPlacementColor = false,
  discographyShowCell,
  wlHomeV2RowChrome = false,
}: SetlistEntryRowProps) {
  const rarity = calculateRarity(
    entry.times_played_num,
    entry.shows_since_debut_num
  )
  const rarityColor = getRarityColor(rarity || null)
  const placementToken = getPlacementBarCssToken(entry.entry_placement ?? null)
  const lastBadgeStyle = getLastCountBadgeStyle(entry.last_count)
  const isCopied = copiedEntryIds?.has(entry.entry_id) ?? false
  const canCopyNumber = !!(showAdminUi && onNumberClick)
  const numberUsesPlacementColor =
    !suppressNumberPlacementColor && placementToken !== "none"

  const [guestsTruncCollapsed, setGuestsTruncCollapsed] = useState(false)
  const [coachTruncCollapsed, setCoachTruncCollapsed] = useState(false)

  const entryCategory =
    entry.song_category || entry.songs?.song_category || "undefined"
  const entryIdsForRelease = hoveredReleaseId
    ? releaseToEntriesMap?.[hoveredReleaseId]
    : undefined
  const isEntryOnHoveredRelease = !!entryIdsForRelease?.has(entry.entry_id)
  const shouldHighlightRow = hoveredReleaseId
    ? isEntryOnHoveredRelease
    : !!hoveredCategory && entryCategory === hoveredCategory
  const shouldDimRow = hoveredReleaseId
    ? !isEntryOnHoveredRelease
    : !!hoveredCategory && entryCategory !== hoveredCategory

  const pxPad = DISPLAY_SETLIST_TABLE_CELL_PAD
  const personnelMw = wlHomeV2RowChrome ? "max-w-[400px]" : "max-w-[300px]"
  const personnelMeasure = cn("w-max", personnelMw)

  return (
    <TableRow
      className={cn(
        wlHomeV2RowChrome ?
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
          wlHomeV2RowChrome ?
            cn(
              "num-cell text-center tabular-nums",
              isCopied && "num-cell--copied",
              suppressNumberPlacementColor && "num-cell--no-placement-bar",
            )
          : cn(
              "display-setlist-num-cell text-center tabular-nums",
              isCopied ?
                "bg-green-600 text-white"
              : suppressNumberPlacementColor ?
                "text-foreground"
              : numberUsesPlacementColor ?
                "text-white"
              : "text-muted-foreground",
            ),
        )}
        {...(!wlHomeV2RowChrome &&
        !isCopied &&
        numberUsesPlacementColor ?
          { "data-placement-bar": placementToken }
        : {})}
      >
        {wlHomeV2RowChrome && !suppressNumberPlacementColor ?
          <span className="bar" data-placement-bar={placementToken} />
        : null}
        <SetlistEntryNumberCell
          entry={entry}
          displayNumber={displayNumber}
          isCopied={isCopied}
          canCopyNumber={canCopyNumber}
          onNumberClick={onNumberClick}
        />
      </TableCell>
      <TableCell
        className={cn(
          pxPad,
          wlHomeV2RowChrome ? "align-middle song-cell" : "align-top",
        )}
      >
        <SetlistEntrySongCell
          entry={entry}
          onSongClick={onSongClick}
          onJotyClick={onJotyClick}
          showStatsTooltip={showTooltips}
          statsTooltipWlV2Chrome={wlHomeV2RowChrome}
        />
      </TableCell>
      {discographySourceLabel !== undefined ?
        <SetlistEntryDiscographyShowCell
          discographySourceLabel={discographySourceLabel}
          discographyShowCell={discographyShowCell}
          wlHomeV2RowChrome={wlHomeV2RowChrome}
        />
      : null}
      {showWtedColumn && (
        <TableCell
          className={cn(pxPad, wlHomeV2RowChrome ? "center" : "text-center")}
        >
          <SetlistEntryWtedCell
            entry={entry}
            onWtedClick={onWtedClick}
            showTooltips={showTooltips}
            tooltipContentClassName={
              wlHomeV2RowChrome ?
                SETLIST_V2_ROW_TOOLTIP_CONTENT.className
              : undefined
            }
          />
        </TableCell>
      )}
      <TableCell
        className={cn(
          pxPad,
          wlHomeV2RowChrome ?
            "center time-cell tabular-nums"
          : "text-center tabular-nums text-muted-foreground",
        )}
      >
        {formatEntryLength(entry.entry_length) ?? ""}
      </TableCell>
      {showCanonColumns && (
        <TableCell
          className={cn(
            pxPad,
            wlHomeV2RowChrome ?
              "last-cell"
            : "text-center text-muted-foreground",
          )}
        >
          <SetlistEntryLastCell
            entry={entry}
            lastBadgeStyle={lastBadgeStyle}
            showTooltips={showTooltips}
            useWlHomeV2PillStyle={wlHomeV2RowChrome}
            tooltipContentClassName={
              wlHomeV2RowChrome ?
                SETLIST_V2_ROW_TOOLTIP_CONTENT.className
              : undefined
            }
          />
        </TableCell>
      )}
      {showCanonColumns && (
        <TableCell
          className={cn(
            pxPad,
            wlHomeV2RowChrome ?
              "tour-cell"
            : "text-center tabular-nums text-muted-foreground",
          )}
        >
          {entry.song_tour_count ?? ""}
        </TableCell>
      )}
      {showCanonColumns && (
        <TableCell
          className={cn(
            pxPad,
            wlHomeV2RowChrome ? "rarity-cell" : "text-center",
          )}
        >
          {rarity ?
            wlHomeV2RowChrome ?
              <span
                className="rare-pill"
                style={
                  {
                    "--setlist-rare-fill": getRarityPillBackground(rarity),
                    "--setlist-rare-border": rarityColor ?? "transparent",
                  } as CSSProperties
                }
              >
                {rarity}
              </span>
            : (
              <span
                className="display-setlist-rarity-pill"
                style={
                  {
                    "--display-setlist-rarity-bg": getRarityPillBackground(rarity),
                    "--display-setlist-rarity-border": rarityColor ?? "transparent",
                  } as CSSProperties
                }
              >
                {rarity}
              </span>
            )
          : null}
        </TableCell>
      )}
      <TableCell
        className={cn(
          pxPad,
          wlHomeV2RowChrome ?
            cn("personnel-cell w-max", personnelMw)
          : cn("w-max max-w-[300px]"),
          guestsTruncCollapsed ? "align-middle" : "align-top",
        )}
      >
        {entry.guests?.length ?
          <SetlistTruncatableCell
            maxWidthClass={personnelMw}
            measureWidthClass={personnelMeasure}
            measureKey={`${entry.entry_id}-guests`}
            expandLabel="Show all personnel"
            onTruncatedCollapsedChange={setGuestsTruncCollapsed}
          >
            <SetlistEntryGuestsCell
              entry={entry}
              showTooltips={showTooltips}
              useWlHomeV2PillStyle={wlHomeV2RowChrome}
              tooltipContentClassName={
                wlHomeV2RowChrome ?
                  SETLIST_V2_ROW_TOOLTIP_CONTENT.className
                : undefined
              }
            />
          </SetlistTruncatableCell>
        : null}
      </TableCell>
      <TableCell
        className={cn(
          pxPad,
            wlHomeV2RowChrome ?
              cn("notes-cell max-w-[400px]")
            : cn("w-max max-w-[400px] py-[1px]"),
          coachTruncCollapsed ? "align-middle" : "align-top",
        )}
      >
        {entry.entry_coachnotes?.trim() ?
          <SetlistTruncatableHtmlCell
            maxWidthClass="max-w-[400px]"
            measureWidthClass="w-max max-w-[400px]"
            measureKey={`${entry.entry_id}-coach`}
            html={entry.entry_coachnotes.trim()}
            expandLabel="Show full coach notes"
            {...(wlHomeV2RowChrome ?
              ({
                htmlContentClassName: "setlist-v2-notes-html",
                blockPlainClassName: "setlist-v2-notes-plain",
              } as const)
            : {})}
            onTruncatedCollapsedChange={setCoachTruncCollapsed}
          />
        : null}
      </TableCell>
    </TableRow>
  )
}
