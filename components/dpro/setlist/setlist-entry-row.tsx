"use client"

import Link from "next/link"
import {
  TableCell,
  TableRow,
} from "@/components/ui/table"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import {
  getLastCountBadgeStyle,
  getPlacementIndexCellBg,
} from "@/components/dpro/setlist/display-setlist-table.constants"
import { getRarityColor } from "@/lib/setlist-utils"
import {
  calculateRarity,
  formatEntryLength,
} from "@/lib/setlist-utils"
import { cn } from "@/lib/utils"
import type {
  DiscographyShowColumnCell,
  GuestGroup,
  SetlistEntry,
} from "@/types/setlist"
import { SetlistEntrySongCell } from "./setlist-entry-song-cell"
import { SetlistEntryNumberCell } from "./setlist-entry-number-cell"
import { SetlistEntryWtedCell } from "./setlist-entry-wted-cell"
import { SetlistEntryLastCell } from "./setlist-entry-last-cell"
import { SetlistEntryGuestsCell } from "./setlist-entry-guests-cell"
import { venueLocationAlreadyBracketed } from "@/lib/format-venue-location-brackets"

function DiscographyShowVenueInner({
  cell,
}: {
  cell: DiscographyShowColumnCell
}) {
  const label = cell.venueLabel!
  if (cell.venueId) {
    return (
      <Link
        href={`/archive/venue/${cell.venueId}`}
        className="font-normal text-foreground hover:underline"
      >
        {label}
      </Link>
    )
  }
  if (cell.venueSlug) {
    return (
      <Link
        href={`/archive/venue/${encodeURIComponent(cell.venueSlug)}`}
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
  /** When set (including `""`), extra column after Personnel for discography source line. */
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
  const indexCellBg = getPlacementIndexCellBg(entry.entry_placement ?? null)
  const lastBadgeStyle = getLastCountBadgeStyle(entry.last_count)
  const isCopied = copiedEntryIds?.has(entry.entry_id) ?? false
  const canCopyNumber = !!(showAdminUi && onNumberClick)
  const numberUsesPlacementColor =
    !suppressNumberPlacementColor && indexCellBg !== "transparent"

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
        className={`text-center tabular-nums ${
          isCopied
            ? "bg-green-600 text-white"
            : suppressNumberPlacementColor
              ? "text-foreground"
              : numberUsesPlacementColor
                ? "text-white"
                : "text-muted-foreground"
        }`}
        style={{
          backgroundColor:
            isCopied || suppressNumberPlacementColor
              ? undefined
              : numberUsesPlacementColor
                ? indexCellBg
                : undefined,
        }}
      >
        <SetlistEntryNumberCell
          entry={entry}
          displayNumber={displayNumber}
          isCopied={isCopied}
          canCopyNumber={canCopyNumber}
          onNumberClick={onNumberClick}
        />
      </TableCell>
      <TableCell className="max-w-[470px]">
        <SetlistEntrySongCell
          entry={entry}
          onSongClick={onSongClick}
          onJotyClick={onJotyClick}
        />
      </TableCell>
      {showWtedColumn && (
        <TableCell className="text-center">
          <SetlistEntryWtedCell
            entry={entry}
            onWtedClick={onWtedClick}
            showTooltips={showTooltips}
          />
        </TableCell>
      )}
      <TableCell className="text-center tabular-nums text-muted-foreground">
        {formatEntryLength(entry.entry_length) ?? ""}
      </TableCell>
      {showCanonColumns && (
        <TableCell className="text-center text-muted-foreground">
          <SetlistEntryLastCell
            entry={entry}
            lastBadgeStyle={lastBadgeStyle}
            showTooltips={showTooltips}
          />
        </TableCell>
      )}
      {showCanonColumns && (
        <TableCell className="text-center tabular-nums text-muted-foreground">
          {entry.song_tour_count ?? ""}
        </TableCell>
      )}
      {showCanonColumns && (
        <TableCell className="text-center">
          {rarity ? (
            <span
              className="inline-flex justify-center rounded px-1.5 py-0.5 text-[11px] font-medium text-white"
              style={{ backgroundColor: rarityColor }}
            >
              {rarity}
            </span>
          ) : null}
        </TableCell>
      )}
      <TableCell className="min-w-[400px] max-w-[600px]">
        <SetlistEntryGuestsCell entry={entry} showTooltips={showTooltips} />
      </TableCell>
      {discographySourceLabel !== undefined ? (
        <TableCell className="max-w-[14rem] min-w-[9rem] whitespace-normal text-left text-[11px]">
          {discographyShowCell !== undefined ? (
            discographyShowCell ? (
              <span className="inline-flex flex-wrap items-baseline gap-x-1.5 text-foreground">
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
    </TableRow>
  )
}
