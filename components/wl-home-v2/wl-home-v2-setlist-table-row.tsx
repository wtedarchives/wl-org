"use client"

import { useState, type CSSProperties } from "react"

import { SongDisplayName } from "@/components/dpro/song-display-name"
import {
  getLastCountBadgeStyle,
  jotyRoundDataAttr,
  shouldShowSetlistEntryShort,
} from "@/components/dpro/setlist/display-setlist-table.constants"
import { SetlistEntryGuestsCell } from "@/components/dpro/setlist/setlist-entry-guests-cell"
import { SetlistEntryLastCell } from "@/components/dpro/setlist/setlist-entry-last-cell"
import { SetlistEntryNumberCell } from "@/components/dpro/setlist/setlist-entry-number-cell"
import { SetlistEntryWtedCell } from "@/components/dpro/setlist/setlist-entry-wted-cell"
import {
  SetlistEntryStatsTooltipContent,
  entryHasSongStatsLines,
} from "@/components/dpro/setlist/setlist-entry-stats-tooltip-content"
import {
  SetlistTruncatableCell,
  SetlistTruncatableHtmlCell,
} from "@/components/dpro/setlist/setlist-truncatable-cell"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  calculateRarity,
  formatEntryLength,
  getRarityColor,
  getRarityPillBackground,
} from "@/lib/setlist-utils"
import { cn } from "@/lib/utils"

import { getPlacementBarCssToken } from "@/lib/placement-bar-color"

import { SETLIST_V2_ROW_TOOLTIP_CONTENT } from "@/components/wl-home-v2/wl-home-v2-setlist-table.constants"
import { railLabelForEntrySet } from "@/components/wl-home-v2/wl-home-v2-setlist-table.utils"
import type { ReleaseToEntriesMap } from "@/hooks/use-setlist-releases"
import type { SetlistEntry } from "@/types/setlist"

/** One setlist row — `onDataCellPointerEnter` is desktop-only so iOS taps are not cancelled by a hover re-render. */
export function WlHomeV2SetlistTableRow({
  entry,
  displayNumber,
  showCanonColumns,
  showWtedColumn,
  isDesktop,
  isFirstOfRun,
  runSpan,
  isRowHovered,
  onDataCellPointerEnter,
  onSetRailPointerEnter,
  onJotyBadgeClick,
  onSongClick,
  onWtedClick,
  showTimeColumn,
  showCoachColumn,
  showAdminUi,
  copiedEntryIds,
  onNumberClick,
  hoveredReleaseId,
  releaseToEntriesMap,
  hoveredCategory,
  showDiscographySetUi,
}: {
  entry: SetlistEntry
  displayNumber: number | null
  showCanonColumns: boolean
  showWtedColumn: boolean
  showTimeColumn: boolean
  showCoachColumn: boolean
  isDesktop: boolean
  isFirstOfRun: boolean
  runSpan: number
  isRowHovered: boolean
  onDataCellPointerEnter: () => void
  onSetRailPointerEnter: () => void
  onJotyBadgeClick?: (entry: SetlistEntry) => void
  onSongClick?: (entry: SetlistEntry) => void
  onWtedClick?: (entry: SetlistEntry) => void
  showAdminUi?: boolean
  copiedEntryIds?: Set<string>
  onNumberClick?: (entryId: string) => void
  hoveredReleaseId?: string | null
  releaseToEntriesMap?: ReleaseToEntriesMap
  hoveredCategory?: string | null
  /** Set rail, set-break rows, and # placement bar — off when `show.discography_display === false`. */
  showDiscographySetUi: boolean
}) {
  const [coachCollapsed, setCoachCollapsed] = useState(false)
  const [personnelTruncCollapsed, setPersonnelTruncCollapsed] = useState(false)

  const railClass = cn(
    "set-section-rail",
    entry.entry_set?.startsWith("E") && "set-section-rail--encore",
  )
  const barPlacementToken = getPlacementBarCssToken(entry.entry_placement)
  const isCopied = copiedEntryIds?.has(entry.entry_id) ?? false
  const canCopyNumber = !!(showAdminUi && onNumberClick)
  const rarity = calculateRarity(
    entry.times_played_num,
    entry.shows_since_debut_num,
  )
  const rarityPillBackground = getRarityPillBackground(rarity || null)
  const rarityPillBorderColor = getRarityColor(rarity || null)
  const lastBadgeStyle = getLastCountBadgeStyle(entry.last_count)
  const shortShown = shouldShowSetlistEntryShort(
    entry.entry_song,
    entry.entry_short,
  )
  const jotyAttr = entry.joty_round ? jotyRoundDataAttr(entry.joty_round) : null

  const entryIdsForRelease = hoveredReleaseId
    ? releaseToEntriesMap?.[hoveredReleaseId]
    : undefined
  const isEntryOnHoveredRelease = !!entryIdsForRelease?.has(entry.entry_id)
  const shouldReleaseHighlight =
    !!hoveredReleaseId && isEntryOnHoveredRelease
  const shouldReleaseDim =
    !!hoveredReleaseId && !isEntryOnHoveredRelease

  const entryCategory =
    entry.song_category || entry.songs?.song_category || "undefined"
  const shouldCategoryHighlight =
    !hoveredReleaseId &&
    !!hoveredCategory &&
    entryCategory === hoveredCategory
  const shouldCategoryDim =
    !hoveredReleaseId &&
    !!hoveredCategory &&
    entryCategory !== hoveredCategory

  const shouldRowHighlight = shouldReleaseHighlight || shouldCategoryHighlight
  const shouldRowDim = shouldReleaseDim || shouldCategoryDim

  const showSongStatsTooltip = isDesktop && entryHasSongStatsLines(entry)
  const songCellInner = (
    <div className="song-cell-inner">
      <div className="song-cell-main">
        {onSongClick ?
          <button
            type="button"
            className="song-cell-song-hit"
            onClick={() => onSongClick(entry)}
          >
            <SongDisplayName
              song={entry.entry_song}
              songDisplayName={entry.songs?.song_displayname}
            />
          </button>
        : <SongDisplayName
            song={entry.entry_song}
            songDisplayName={entry.songs?.song_displayname}
          />
        }
        {shortShown && entry.entry_short ?
          <span className="short">{entry.entry_short}</span>
        : null}
        {entry.entry_segue ?
          <span className="segue">
            → {entry.entry_segue.replace(/^>\s*/, "").trim()}
          </span>
        : null}
      </div>
      {jotyAttr ?
        <div className="song-cell-joty">
          {onJotyBadgeClick ?
            <button
              type="button"
              className="joty-pill"
              data-joty-round={jotyAttr}
              onClick={() => onJotyBadgeClick(entry)}
              aria-label={`Jam of the Year: ${entry.joty_round}`}
            >
              {entry.joty_round}
            </button>
          : <span className="joty-pill" data-joty-round={jotyAttr}>
              {entry.joty_round}
            </span>
          }
        </div>
      : null}
    </div>
  )

  return (
    <tr
      className={cn(
        "song-row",
        isRowHovered && "song-row--row-hover",
        shouldRowHighlight && "song-row--release-highlight",
        shouldRowDim && "song-row--release-dim",
      )}
    >
      {showDiscographySetUi && isFirstOfRun ?
        <td
          className={railClass}
          rowSpan={runSpan}
          onPointerEnter={isDesktop ? onSetRailPointerEnter : undefined}
        >
          <span className="set-section-rail-text">
            {railLabelForEntrySet(entry.entry_set, runSpan)}
          </span>
        </td>
      : null}
      <td
        className={cn(
          "num-cell",
          isCopied && "num-cell--copied",
          !showDiscographySetUi && "num-cell--no-placement-bar",
        )}
        onPointerEnter={isDesktop ? onDataCellPointerEnter : undefined}
      >
        {showDiscographySetUi ?
          <span
            className="bar"
            data-placement-bar={barPlacementToken}
          />
        : null}
        <SetlistEntryNumberCell
          entry={entry}
          displayNumber={displayNumber}
          isCopied={isCopied}
          canCopyNumber={canCopyNumber}
          onNumberClick={onNumberClick}
        />
      </td>
      <td
        className="song-cell"
        onPointerEnter={isDesktop ? onDataCellPointerEnter : undefined}
      >
        {showSongStatsTooltip ?
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex w-full min-w-0 cursor-default flex-col text-left">
                {songCellInner}
              </div>
            </TooltipTrigger>
            <TooltipContent {...SETLIST_V2_ROW_TOOLTIP_CONTENT}>
              <SetlistEntryStatsTooltipContent entry={entry} />
            </TooltipContent>
          </Tooltip>
        : songCellInner}
      </td>
      {showWtedColumn ?
        <td
          className="center"
          onPointerEnter={isDesktop ? onDataCellPointerEnter : undefined}
        >
          <SetlistEntryWtedCell
            entry={entry}
            onWtedClick={onWtedClick}
            showTooltips={isDesktop}
            tooltipContentClassName={SETLIST_V2_ROW_TOOLTIP_CONTENT.className}
          />
        </td>
      : null}
      {showTimeColumn ?
        <td
          className="time-cell"
          onPointerEnter={isDesktop ? onDataCellPointerEnter : undefined}
        >
          {formatEntryLength(entry.entry_length) ?? ""}
        </td>
      : null}
      {showCanonColumns ?
        <td
          className="last-cell"
          onPointerEnter={isDesktop ? onDataCellPointerEnter : undefined}
        >
          <SetlistEntryLastCell
            entry={entry}
            lastBadgeStyle={lastBadgeStyle}
            showTooltips={isDesktop}
            useWlHomeV2PillStyle
            tooltipContentClassName={SETLIST_V2_ROW_TOOLTIP_CONTENT.className}
          />
        </td>
      : null}
      {showCanonColumns ?
        <td
          className="tour-cell"
          onPointerEnter={isDesktop ? onDataCellPointerEnter : undefined}
        >
          {entry.song_tour_count ?? ""}
        </td>
      : null}
      {showCanonColumns ?
        <td
          className="rarity-cell"
          onPointerEnter={isDesktop ? onDataCellPointerEnter : undefined}
        >
          {rarity ?
            <span
              className="rare-pill"
              style={
                {
                  "--setlist-rare-fill": rarityPillBackground,
                  "--setlist-rare-border": rarityPillBorderColor,
                } as CSSProperties
              }
            >
              {rarity}
            </span>
          : null}
        </td>
      : null}
      <td
        className={cn(
          "personnel-cell",
          personnelTruncCollapsed ? "align-middle" : "align-top",
        )}
        onPointerEnter={isDesktop ? onDataCellPointerEnter : undefined}
      >
        {entry.guests?.length ?
          <SetlistTruncatableCell
            maxWidthClass="max-w-[400px]"
            measureWidthClass="w-max max-w-[400px]"
            measureKey={`${entry.entry_id}-personnel`}
            expandLabel="Show all personnel"
            onTruncatedCollapsedChange={setPersonnelTruncCollapsed}
          >
            <SetlistEntryGuestsCell
              entry={entry}
              showTooltips={isDesktop}
              nowrap={false}
              useWlHomeV2PillStyle
              tooltipContentClassName={SETLIST_V2_ROW_TOOLTIP_CONTENT.className}
            />
          </SetlistTruncatableCell>
        : null}
      </td>
      {showCoachColumn ?
        <td
          className={cn(
            "notes-cell",
            coachCollapsed ? "align-middle" : "align-top",
          )}
          onPointerEnter={isDesktop ? onDataCellPointerEnter : undefined}
        >
          {entry.entry_coachnotes?.trim() ?
            <SetlistTruncatableHtmlCell
              maxWidthClass="max-w-[400px]"
              measureWidthClass="w-max max-w-[400px]"
              measureKey={`${entry.entry_id}-coach`}
              html={entry.entry_coachnotes.trim()}
              expandLabel="Show full coach notes"
              htmlContentClassName="setlist-v2-notes-html"
              blockPlainClassName="setlist-v2-notes-plain"
              onTruncatedCollapsedChange={setCoachCollapsed}
            />
          : null}
        </td>
      : null}
    </tr>
  )
}
