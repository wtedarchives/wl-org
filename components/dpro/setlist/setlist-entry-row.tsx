"use client"

import Link from "next/link"
import { useState, type CSSProperties } from "react"
import {
  TableCell,
  TableRow,
} from "@/components/ui/table"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"
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
import { venueLocationAlreadyBracketed } from "@/lib/format-venue-location-brackets"
import { getPlacementBarCssToken } from "@/lib/placement-bar-color"

function DiscographyShowVenueInner({
  cell,
}: {
  cell: DiscographyShowColumnCell
}) {
  const label = cell.venueLabel!
  if (cell.venueId) {
    return (
      <Link
        href={getVenueArchiveUrl(cell.venueId)}
        className="font-normal text-foreground hover:underline"
      >
        {label}
      </Link>
    )
  }
  if (cell.venueSlug) {
    return (
      <Link
        href={getVenueArchiveUrl(cell.venueSlug)}
        className="font-normal text-foreground hover:underline"
      >
        {label}
      </Link>
    )
  }
  return <span className="font-normal text-foreground">{label}</span>
}

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

  return (
    <TableRow
      className={cn(
        "border-border/60 transition-opacity",
        shouldHighlightRow && "bg-primary/20",
        shouldDimRow && "opacity-10"
      )}
    >
      <TableCell
        className={cn(
          DISPLAY_SETLIST_TABLE_CELL_PAD,
          "display-setlist-num-cell text-center tabular-nums",
          isCopied
            ? "bg-green-600 text-white"
            : suppressNumberPlacementColor
              ? "text-foreground"
              : numberUsesPlacementColor
                ? "text-white"
                : "text-muted-foreground",
        )}
        data-placement-bar={
          !isCopied && numberUsesPlacementColor ? placementToken : undefined
        }
      >
        <SetlistEntryNumberCell
          entry={entry}
          displayNumber={displayNumber}
          isCopied={isCopied}
          canCopyNumber={canCopyNumber}
          onNumberClick={onNumberClick}
        />
      </TableCell>
      <TableCell
        className={cn(DISPLAY_SETLIST_TABLE_CELL_PAD, "align-top")}
      >
        <SetlistEntrySongCell
          entry={entry}
          onSongClick={onSongClick}
          onJotyClick={onJotyClick}
          showStatsTooltip={showTooltips}
        />
      </TableCell>
      {discographySourceLabel !== undefined ? (
        <TableCell
          className={cn(
            DISPLAY_SETLIST_TABLE_CELL_PAD,
            "min-w-[9rem] whitespace-nowrap text-left text-[11px]",
          )}
        >
          {discographyShowCell !== undefined ? (
            discographyShowCell ? (
              <span className="inline-flex flex-nowrap items-baseline gap-x-1.5 text-foreground">
                <Link
                  href={getSetlistArchiveUrl(discographyShowCell.showId)}
                  className="font-medium text-foreground hover:underline"
                >
                  {discographyShowCell.dateLabel}
                </Link>
                {discographyShowCell.venueLabel ? (
                  venueLocationAlreadyBracketed(
                    discographyShowCell.venueLabel,
                  ) ? (
                    <DiscographyShowVenueInner cell={discographyShowCell} />
                  ) : (
                    <span>
                      {"["}
                      <DiscographyShowVenueInner cell={discographyShowCell} />
                      {"]"}
                    </span>
                  )
                ) : null}
              </span>
            ) : null
          ) : (
            <span className="text-muted-foreground">
              {discographySourceLabel}
            </span>
          )}
        </TableCell>
      ) : null}
      {showWtedColumn && (
        <TableCell
          className={cn(DISPLAY_SETLIST_TABLE_CELL_PAD, "text-center")}
        >
          <SetlistEntryWtedCell
            entry={entry}
            onWtedClick={onWtedClick}
            showTooltips={showTooltips}
          />
        </TableCell>
      )}
      <TableCell
        className={cn(
          DISPLAY_SETLIST_TABLE_CELL_PAD,
          "text-center tabular-nums text-muted-foreground",
        )}
      >
        {formatEntryLength(entry.entry_length) ?? ""}
      </TableCell>
      {showCanonColumns && (
        <TableCell
          className={cn(
            DISPLAY_SETLIST_TABLE_CELL_PAD,
            "text-center text-muted-foreground",
          )}
        >
          <SetlistEntryLastCell
            entry={entry}
            lastBadgeStyle={lastBadgeStyle}
            showTooltips={showTooltips}
          />
        </TableCell>
      )}
      {showCanonColumns && (
        <TableCell
          className={cn(
            DISPLAY_SETLIST_TABLE_CELL_PAD,
            "text-center tabular-nums text-muted-foreground",
          )}
        >
          {entry.song_tour_count ?? ""}
        </TableCell>
      )}
      {showCanonColumns && (
        <TableCell
          className={cn(DISPLAY_SETLIST_TABLE_CELL_PAD, "text-center")}
        >
          {rarity ? (
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
          ) : null}
        </TableCell>
      )}
      <TableCell
        className={cn(
          DISPLAY_SETLIST_TABLE_CELL_PAD,
          "w-max max-w-[300px]",
          guestsTruncCollapsed ? "align-middle" : "align-top",
        )}
      >
        {entry.guests?.length ?
          <SetlistTruncatableCell
            maxWidthClass="max-w-[300px]"
            measureWidthClass="w-max max-w-[300px]"
            measureKey={`${entry.entry_id}-guests`}
            expandLabel="Show all personnel"
            onTruncatedCollapsedChange={setGuestsTruncCollapsed}
          >
            <SetlistEntryGuestsCell entry={entry} showTooltips={showTooltips} />
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
        {entry.entry_coachnotes?.trim() ?
          <SetlistTruncatableHtmlCell
            maxWidthClass="max-w-[400px]"
            measureWidthClass="w-max max-w-[400px]"
            measureKey={`${entry.entry_id}-coach`}
            html={entry.entry_coachnotes.trim()}
            expandLabel="Show full coach notes"
            onTruncatedCollapsedChange={setCoachTruncCollapsed}
          />
        : null}
      </TableCell>
    </TableRow>
  )
}
