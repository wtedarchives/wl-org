"use client"

import Link from "next/link"
import {
  TableCell,
  TableRow,
} from "@/components/ui/table"
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
import type { SetlistEntry, GuestGroup } from "@/types/setlist"
import { SetlistEntrySongCell } from "./setlist-entry-song-cell"
import { SetlistEntryNumberCell } from "./setlist-entry-number-cell"
import { SetlistEntryWtedCell } from "./setlist-entry-wted-cell"
import { SetlistEntryLastCell } from "./setlist-entry-last-cell"
import { SetlistEntryGuestsCell } from "./setlist-entry-guests-cell"

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
        className={`text-center tabular-nums ${isCopied ? "bg-green-600 text-white" : indexCellBg !== "transparent" ? "text-white" : "text-muted-foreground"}`}
        style={{
          backgroundColor: isCopied ? undefined : indexCellBg !== "transparent" ? indexCellBg : undefined,
        }}
      >
        <SetlistEntryNumberCell
          entry={entry}
          displayNumber={displayNumber}
          isCopied={isCopied}
          canCopyNumber={canCopyNumber}
          showTooltips={showTooltips}
          onNumberClick={onNumberClick}
        />
      </TableCell>
      <TableCell className="max-w-[470px]">
        <SetlistEntrySongCell
          entry={entry}
          onSongClick={onSongClick}
          onJotyClick={onJotyClick}
          showTooltips={showTooltips}
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
    </TableRow>
  )
}
