"use client"

import { useState, type CSSProperties } from "react"

import {
  getLastCountBadgeStyle,
  getSetlistEntrySongSpreadCategoryKey,
} from "@/components/dpro/setlist/display-setlist-table.constants"
import { SetlistEntryGuestsCell } from "@/components/dpro/setlist/setlist-entry-guests-cell"
import { SetlistEntrySongCell } from "@/components/dpro/setlist/setlist-entry-song-cell"
import { SetlistEntryStatsTooltip } from "@/components/dpro/setlist/setlist-entry-stats-tooltip"
import { entryHasSongStatsLines } from "@/components/dpro/setlist/setlist-entry-stats-tooltip-content"
import { SetlistEntryLastCell } from "@/components/dpro/setlist/setlist-entry-last-cell"
import { SetlistEntryNumberCell } from "@/components/dpro/setlist/setlist-entry-number-cell"
import { SetlistEntryWtedCell } from "@/components/dpro/setlist/setlist-entry-wted-cell"
import { SetlistEntryBandcampCell } from "@/components/dpro/setlist/setlist-entry-bandcamp-cell"
import { SetlistEntryYouTubeCell } from "@/components/dpro/setlist/setlist-entry-youtube-cell"
import {
  SetlistTruncatableCell,
  SetlistTruncatableHtmlCell,
} from "@/components/dpro/setlist/setlist-truncatable-cell"
import {
  calculateRarity,
  formatEntryLength,
  getRarityColor,
  getRarityPillBackground,
} from "@/lib/setlist-utils"
import { cn } from "@/lib/utils"

import { getCoachIntroDisplay } from "@/lib/setlist-coach-intro-display"
import { getPlacementBarCssToken } from "@/lib/placement-bar-color"

import { SETLIST_V2_ROW_TOOLTIP_CONTENT } from "@/components/wl-home-v2/wl-home-v2-setlist-table.constants"
import { WlHomeV2SetlistSongTreeChrome } from "@/components/wl-home-v2/wl-home-v2-setlist-song-tree-chrome"
import { railLabelForEntrySet } from "@/components/wl-home-v2/wl-home-v2-setlist-table.utils"
import type { ReleaseToEntriesMap, ShowRelease } from "@/hooks/use-setlist-releases"
import type { SetlistTreeChrome } from "@/lib/song-pairs"
import type { SetlistEntry } from "@/types/setlist"

/** One setlist row — `onDataCellPointerEnter` is desktop-only so iOS taps are not cancelled by a hover re-render. */
export function WlHomeV2SetlistTableRow({
  entry,
  displayNumber,
  showCanonColumns,
  showWtedColumn,
  showMediaColumn,
  isDesktop,
  isFirstOfRun,
  runSpan,
  isRowHovered,
  onDataCellPointerEnter,
  onSetRailPointerEnter,
  onJotyBadgeClick,
  onSongClick,
  onWtedClick,
  onBandcampClick,
  youtubeRelease,
  onYouTubeClick,
  showTimeColumn,
  showCoachColumn,
  showAdminUi,
  copiedEntryIds,
  onNumberClick,
  hoveredReleaseId,
  releaseToEntriesMap,
  hoveredCategory,
  showDiscographySetUi,
  coachNotesExpanded = false,
  applyCoachIntroDisplay = true,
  treeChrome,
}: {
  entry: SetlistEntry
  displayNumber: number | null
  showCanonColumns: boolean
  showWtedColumn: boolean
  showMediaColumn: boolean
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
  onBandcampClick?: (entry: SetlistEntry) => void
  youtubeRelease?: ShowRelease | null
  onYouTubeClick?: (release: ShowRelease) => void
  showAdminUi?: boolean
  copiedEntryIds?: Set<string>
  onNumberClick?: (entryId: string) => void
  hoveredReleaseId?: string | null
  releaseToEntriesMap?: ReleaseToEntriesMap
  hoveredCategory?: string | null
  /** Set rail, set-break rows, and # placement bar — off when `show.discography_display === false`. */
  showDiscographySetUi: boolean
  coachNotesExpanded?: boolean
  /** Off for entries that belong to pair/reprise/improv combine rows (including expanded). */
  applyCoachIntroDisplay?: boolean
  treeChrome?: SetlistTreeChrome
}) {
  const [personnelTruncCollapsed, setPersonnelTruncCollapsed] = useState(false)
  const coachIntroDisplay =
    applyCoachIntroDisplay ? getCoachIntroDisplay(entry) : null
  const coachNotesHtml =
    coachIntroDisplay ?
      coachIntroDisplay.displayCoachNotes
    : entry.entry_coachnotes?.trim() ?? null

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

  const entryIdsForRelease = hoveredReleaseId
    ? releaseToEntriesMap?.[hoveredReleaseId]
    : undefined
  const isEntryOnHoveredRelease = !!entryIdsForRelease?.has(entry.entry_id)
  const shouldReleaseHighlight =
    !!hoveredReleaseId && isEntryOnHoveredRelease
  const shouldReleaseDim =
    !!hoveredReleaseId && !isEntryOnHoveredRelease

  const entryCategory = getSetlistEntrySongSpreadCategoryKey(entry)
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

  return (
    <tr
      className={cn(
        "song-row",
        isRowHovered && "song-row--row-hover",
        shouldRowHighlight && "song-row--release-highlight",
        shouldRowDim && "song-row--release-dim",
        treeChrome?.role === "parent" && "song-row--tree-parent",
        treeChrome?.role === "child" && "song-row--tree-child",
        treeChrome?.role === "child" &&
          treeChrome.siblingIndex === 0 &&
          "song-row--tree-child-first",
        treeChrome?.role === "child" &&
          treeChrome.isLastSibling &&
          "song-row--tree-child-last",
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
          <span className="bar" data-placement-bar={barPlacementToken} />
        : null}
        <div className="setlist-cell-inner">
          <SetlistEntryNumberCell
            entry={entry}
            displayNumber={displayNumber}
            isCopied={isCopied}
            canCopyNumber={canCopyNumber}
            onNumberClick={onNumberClick}
          />
        </div>
      </td>
      <td
        className="song-cell"
        onPointerEnter={isDesktop ? onDataCellPointerEnter : undefined}
      >
        <WlHomeV2SetlistSongTreeChrome treeChrome={treeChrome}>
          <SetlistEntrySongCell
            entry={entry}
            onSongClick={onSongClick}
            onJotyClick={onJotyBadgeClick}
            showStatsTooltip={isDesktop}
            statsTooltipWlV2Chrome
            songAltName={coachIntroDisplay?.songAltName ?? null}
          />
        </WlHomeV2SetlistSongTreeChrome>
      </td>
      {showWtedColumn ?
        <td
          className="center"
          onPointerEnter={isDesktop ? onDataCellPointerEnter : undefined}
        >
          <div className="setlist-cell-inner">
            <SetlistEntryWtedCell
              entry={entry}
              onWtedClick={onWtedClick}
              showTooltips={isDesktop}
              tooltipContentClassName={SETLIST_V2_ROW_TOOLTIP_CONTENT.className}
            />
          </div>
        </td>
      : null}
      {showTimeColumn ?
        <td
          className="time-cell"
          onPointerEnter={isDesktop ? onDataCellPointerEnter : undefined}
        >
          <div className="setlist-cell-inner">
            {formatEntryLength(entry.entry_length) ?? ""}
          </div>
        </td>
      : null}
      {showCanonColumns ?
        <td
          className="last-cell"
          onPointerEnter={isDesktop ? onDataCellPointerEnter : undefined}
        >
          <div className="setlist-cell-inner">
            <SetlistEntryLastCell
              entry={entry}
              lastBadgeStyle={lastBadgeStyle}
              showTooltips={isDesktop}
              useWlHomeV2PillStyle
              tooltipContentClassName={SETLIST_V2_ROW_TOOLTIP_CONTENT.className}
            />
          </div>
        </td>
      : null}
      {showCanonColumns ?
        <td
          className="tour-cell"
          onPointerEnter={isDesktop ? onDataCellPointerEnter : undefined}
        >
          <div className="setlist-cell-inner">
            {entry.song_tour_count ?? ""}
          </div>
        </td>
      : null}
      {showCanonColumns ?
        <td
          className="rarity-cell"
          onPointerEnter={isDesktop ? onDataCellPointerEnter : undefined}
        >
          <div className="setlist-cell-inner">
            {rarity ?
              isDesktop ?
                <SetlistEntryStatsTooltip entry={entry} wlV2Chrome>
                  <span
                    className={cn(
                      "rare-pill",
                      entryHasSongStatsLines(entry) && "cursor-default",
                    )}
                    style={
                      {
                        "--setlist-rare-fill": rarityPillBackground,
                        "--setlist-rare-border": rarityPillBorderColor,
                      } as CSSProperties
                    }
                  >
                    {rarity}
                  </span>
                </SetlistEntryStatsTooltip>
              : <span
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
          </div>
        </td>
      : null}
      {showMediaColumn ?
        <td
          className="center"
          onPointerEnter={isDesktop ? onDataCellPointerEnter : undefined}
        >
          <div className="setlist-cell-inner flex items-center justify-center gap-2">
            <SetlistEntryBandcampCell
              entry={entry}
              onBandcampClick={onBandcampClick}
              showTooltips={isDesktop}
              tooltipContentClassName={SETLIST_V2_ROW_TOOLTIP_CONTENT.className}
            />
            <SetlistEntryYouTubeCell
              release={youtubeRelease ?? null}
              onYouTubeClick={onYouTubeClick}
              showTooltips={isDesktop}
              tooltipContentClassName={SETLIST_V2_ROW_TOOLTIP_CONTENT.className}
            />
          </div>
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
          className="notes-cell"
          onPointerEnter={isDesktop ? onDataCellPointerEnter : undefined}
        >
          <div className="setlist-cell-inner">
            {coachNotesHtml ?
              <SetlistTruncatableHtmlCell
                maxWidthClass="max-w-[400px]"
                measureWidthClass="w-max max-w-[400px]"
                measureKey={`${entry.entry_id}-coach`}
                html={coachNotesHtml}
                defaultExpanded={coachNotesExpanded}
                expandLabel="Show full coach notes"
                htmlContentClassName="setlist-v2-notes-html"
                blockPlainClassName="setlist-v2-notes-plain"
              />
            : null}
          </div>
        </td>
      : null}
    </tr>
  )
}
