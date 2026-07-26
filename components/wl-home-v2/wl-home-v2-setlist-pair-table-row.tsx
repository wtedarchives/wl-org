"use client"

import { useState } from "react"

import { SetlistEntryGuestsCell } from "@/components/dpro/setlist/setlist-entry-guests-cell"
import { SetlistEntryNumberCell } from "@/components/dpro/setlist/setlist-entry-number-cell"
import { SetlistEntryWtedCell } from "@/components/dpro/setlist/setlist-entry-wted-cell"
import { SetlistEntryBandcampCell } from "@/components/dpro/setlist/setlist-entry-bandcamp-cell"
import { SetlistEntryYouTubeCell } from "@/components/dpro/setlist/setlist-entry-youtube-cell"
import {
  SetlistTruncatableCell,
  SetlistTruncatableHtmlCell,
} from "@/components/dpro/setlist/setlist-truncatable-cell"
import { cn } from "@/lib/utils"

import { WlHomeV2SetlistPairTableRowCanonCells } from "@/components/wl-home-v2/wl-home-v2-setlist-pair-table-row-canon-cells"
import { deriveWlHomeV2SetlistPairTableRowState } from "@/components/wl-home-v2/wl-home-v2-setlist-pair-table-row.utils"
import type { WlHomeV2SetlistPairTableRowProps } from "@/components/wl-home-v2/wl-home-v2-setlist-pair-table-row.types"
import { SETLIST_V2_ROW_TOOLTIP_CONTENT } from "@/components/wl-home-v2/wl-home-v2-setlist-table.constants"
import { WlHomeV2SetlistPairSongCell } from "@/components/wl-home-v2/wl-home-v2-setlist-pair-song-cell"
import { WlHomeV2SetlistSongTreeChrome } from "@/components/wl-home-v2/wl-home-v2-setlist-song-tree-chrome"
import { railLabelForEntrySet } from "@/components/wl-home-v2/wl-home-v2-setlist-table.utils"

export function WlHomeV2SetlistPairTableRow({
  pair,
  entries,
  displayNumber,
  showCanonColumns,
  showWtedColumn,
  showMediaColumn,
  showTimeColumn,
  showCoachColumn,
  isDesktop,
  isFirstOfRun,
  runSpan,
  isRowHovered,
  onDataCellPointerEnter,
  onSetRailPointerEnter,
  onExpand,
  onCoachNotesExpand,
  onJotyBadgeClick,
  onSongClick,
  onWtedClick,
  onBandcampClick,
  youtubeRelease,
  onYouTubeClick,
  showAdminUi,
  copiedEntryIds,
  onNumberClick,
  hoveredReleaseId,
  releaseToEntriesMap,
  hoveredCategory,
  showDiscographySetUi,
  treeChrome,
}: WlHomeV2SetlistPairTableRowProps) {
  const [personnelTruncCollapsed, setPersonnelTruncCollapsed] = useState(false)

  const {
    primaryEntry,
    mergedGuests,
    coachCollapsedHtml,
    combinedLength,
    hasWted,
    wtedProxyEntry,
    hasBandcamp,
    bandcampProxyEntry,
    barPlacementTokens,
    isCopied,
    shouldReleaseHighlight,
    shouldReleaseDim,
    shouldCategoryHighlight,
    shouldCategoryDim,
    guestProxyEntry,
    sharedLastCount,
    sharedTourCount,
    combinedRarity,
    lastBadgeStyle,
    rarityPillBackground,
    rarityPillBorderColor,
  } = deriveWlHomeV2SetlistPairTableRowState({
    entries,
    copiedEntryIds,
    hoveredReleaseId,
    releaseToEntriesMap,
    hoveredCategory,
  })

  const railClass = cn(
    "set-section-rail",
    primaryEntry.entry_set?.startsWith("E") && "set-section-rail--encore",
  )
  const canCopyNumber = !!(showAdminUi && onNumberClick)

  return (
    <tr
      className={cn(
        "song-row song-row--pair",
        isRowHovered && "song-row--row-hover",
        shouldReleaseHighlight && "song-row--release-highlight",
        shouldReleaseDim && "song-row--release-dim",
        shouldCategoryHighlight && "song-row--release-highlight",
        shouldCategoryDim && "song-row--release-dim",
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
            {railLabelForEntrySet(primaryEntry.entry_set, runSpan)}
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
          barPlacementTokens.length > 1 ?
            <span className="bar bar--split" aria-hidden>
              {barPlacementTokens.map((token, index) => (
                <span
                  key={`${token}-${index}`}
                  className="bar-seg"
                  data-placement-bar={token}
                />
              ))}
            </span>
          : <span
              className="bar"
              data-placement-bar={barPlacementTokens[0] ?? "none"}
            />
        : null}
        <div className="setlist-cell-inner">
          <SetlistEntryNumberCell
            entry={primaryEntry}
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
          <WlHomeV2SetlistPairSongCell
            pair={pair}
            entries={entries}
            onExpand={onExpand}
            onSongClick={onSongClick}
            onJotyClick={onJotyBadgeClick}
            showTooltips={isDesktop}
          />
        </WlHomeV2SetlistSongTreeChrome>
      </td>
      {showWtedColumn ?
        <td
          className="center"
          onPointerEnter={isDesktop ? onDataCellPointerEnter : undefined}
        >
          <div className="setlist-cell-inner">
            {hasWted ?
              <SetlistEntryWtedCell
                entry={wtedProxyEntry}
                onWtedClick={
                  onWtedClick ?
                    (_entry) => onWtedClick(entries)
                  : undefined
                }
                showTooltips={isDesktop}
                tooltipContentClassName={SETLIST_V2_ROW_TOOLTIP_CONTENT.className}
              />
            : null}
          </div>
        </td>
      : null}
      {showTimeColumn ?
        <td
          className="time-cell"
          onPointerEnter={isDesktop ? onDataCellPointerEnter : undefined}
        >
          <div className="setlist-cell-inner">{combinedLength}</div>
        </td>
      : null}
      <WlHomeV2SetlistPairTableRowCanonCells
        showCanonColumns={showCanonColumns}
        isDesktop={isDesktop}
        onDataCellPointerEnter={onDataCellPointerEnter}
        entries={entries}
        primaryEntry={primaryEntry}
        sharedLastCount={sharedLastCount}
        lastBadgeStyle={lastBadgeStyle}
        sharedTourCount={sharedTourCount}
        combinedRarity={combinedRarity}
        rarityPillBackground={rarityPillBackground}
        rarityPillBorderColor={rarityPillBorderColor}
        onExpand={onExpand}
      />
      {showMediaColumn ?
        <td
          className="center"
          onPointerEnter={isDesktop ? onDataCellPointerEnter : undefined}
        >
          <div className="setlist-cell-inner flex items-center justify-center gap-1">
            {hasBandcamp ?
              <SetlistEntryBandcampCell
                entry={bandcampProxyEntry}
                onBandcampClick={
                  onBandcampClick ? () => onBandcampClick(entries) : undefined
                }
                showTooltips={isDesktop}
                tooltipContentClassName={SETLIST_V2_ROW_TOOLTIP_CONTENT.className}
              />
            : null}
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
        {mergedGuests.length ?
          <SetlistTruncatableCell
            maxWidthClass="max-w-[400px]"
            measureWidthClass="w-max max-w-[400px]"
            measureKey={`${primaryEntry.entry_id}-pair-personnel`}
            expandLabel="Show all personnel"
            onTruncatedCollapsedChange={setPersonnelTruncCollapsed}
          >
            <SetlistEntryGuestsCell
              entry={guestProxyEntry}
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
            {coachCollapsedHtml ?
              <SetlistTruncatableHtmlCell
                maxWidthClass="max-w-[400px]"
                measureWidthClass="w-max max-w-[400px]"
                measureKey={`${primaryEntry.entry_id}-pair-coach`}
                html={coachCollapsedHtml}
                onExpandClick={onCoachNotesExpand}
                expandLabel="Show individual songs in this pair"
                htmlContentClassName="setlist-v2-notes-html setlist-v2-notes-html--pair-collapsed"
                collapsedHtmlContentClassName="setlist-v2-notes-html setlist-v2-notes-html--pair-collapsed"
                blockPlainClassName="setlist-v2-notes-plain"
              />
            : null}
          </div>
        </td>
      : null}
    </tr>
  )
}
