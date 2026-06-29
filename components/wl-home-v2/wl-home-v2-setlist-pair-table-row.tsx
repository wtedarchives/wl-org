"use client"

import { useState, type CSSProperties } from "react"

import {
  getLastCountBadgeStyle,
  getSetlistEntrySongSpreadCategoryKey,
} from "@/components/dpro/setlist/display-setlist-table.constants"
import { SetlistEntryLastCell } from "@/components/dpro/setlist/setlist-entry-last-cell"
import { SetlistEntryStatsTooltip } from "@/components/dpro/setlist/setlist-entry-stats-tooltip"
import { entriesHaveSongStatsLines } from "@/components/dpro/setlist/setlist-entry-stats-tooltip-content"
import { SetlistEntryGuestsCell } from "@/components/dpro/setlist/setlist-entry-guests-cell"
import { SetlistEntryNumberCell } from "@/components/dpro/setlist/setlist-entry-number-cell"
import { SetlistEntryWtedCell } from "@/components/dpro/setlist/setlist-entry-wted-cell"
import { SetlistExpandButton } from "@/components/dpro/setlist/setlist-expand-button"
import {
  SetlistTruncatableCell,
  SetlistTruncatableHtmlCell,
} from "@/components/dpro/setlist/setlist-truncatable-cell"
import {
  buildPairCoachNotesCollapsedHtml,
  mergePairGuests,
  pairCombinedLength,
  pairHasWted,
  pairPlacementBarTokens,
  pairCombinedRarity,
  pairSharedLastCount,
  pairSharedTourCount,
} from "@/lib/song-pairs"
import {
  getRarityColor,
  getRarityPillBackground,
} from "@/lib/setlist-utils"
import { cn } from "@/lib/utils"

import { SETLIST_V2_ROW_TOOLTIP_CONTENT } from "@/components/wl-home-v2/wl-home-v2-setlist-table.constants"
import { WlHomeV2SetlistPairSongCell } from "@/components/wl-home-v2/wl-home-v2-setlist-pair-song-cell"
import { WlHomeV2SetlistSongTreeChrome } from "@/components/wl-home-v2/wl-home-v2-setlist-song-tree-chrome"
import { railLabelForEntrySet } from "@/components/wl-home-v2/wl-home-v2-setlist-table.utils"
import type { ReleaseToEntriesMap } from "@/hooks/use-setlist-releases"
import type { SetlistTreeChrome } from "@/lib/song-pairs"
import type { SetlistEntry } from "@/types/setlist"
import type { SongPair } from "@/types/song-pair"

export function WlHomeV2SetlistPairTableRow({
  pair,
  entries,
  displayNumber,
  showCanonColumns,
  showWtedColumn,
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
  showAdminUi,
  copiedEntryIds,
  onNumberClick,
  hoveredReleaseId,
  releaseToEntriesMap,
  hoveredCategory,
  showDiscographySetUi,
  treeChrome,
}: {
  pair: SongPair
  entries: SetlistEntry[]
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
  onExpand: () => void
  onCoachNotesExpand: () => void
  onJotyBadgeClick?: (entry: SetlistEntry) => void
  onSongClick?: (entries: SetlistEntry[]) => void
  onWtedClick?: (entries: SetlistEntry[]) => void
  showAdminUi?: boolean
  copiedEntryIds?: Set<string>
  onNumberClick?: (entryId: string) => void
  hoveredReleaseId?: string | null
  releaseToEntriesMap?: ReleaseToEntriesMap
  hoveredCategory?: string | null
  showDiscographySetUi: boolean
  treeChrome?: SetlistTreeChrome
}) {
  const [personnelTruncCollapsed, setPersonnelTruncCollapsed] = useState(false)

  const primaryEntry = entries[0]!
  const mergedGuests = mergePairGuests(entries)
  const coachCollapsedHtml = buildPairCoachNotesCollapsedHtml(entries)
  const combinedLength = pairCombinedLength(entries)
  const hasWted = pairHasWted(entries)
  const wtedProxyEntry = entries.find((e) => e.radio_id) ?? primaryEntry

  const railClass = cn(
    "set-section-rail",
    primaryEntry.entry_set?.startsWith("E") && "set-section-rail--encore",
  )
  const barPlacementTokens = pairPlacementBarTokens(entries)
  const isCopied = entries.some((e) => copiedEntryIds?.has(e.entry_id))
  const canCopyNumber = !!(showAdminUi && onNumberClick)

  const entryIdsForRelease = hoveredReleaseId
    ? releaseToEntriesMap?.[hoveredReleaseId]
    : undefined
  const isOnHoveredRelease = entries.some((e) =>
    entryIdsForRelease?.has(e.entry_id),
  )
  const shouldReleaseHighlight = !!hoveredReleaseId && isOnHoveredRelease
  const shouldReleaseDim = !!hoveredReleaseId && !isOnHoveredRelease

  const shouldCategoryHighlight =
    !hoveredReleaseId &&
    !!hoveredCategory &&
    entries.some(
      (e) => getSetlistEntrySongSpreadCategoryKey(e) === hoveredCategory,
    )
  const shouldCategoryDim =
    !hoveredReleaseId &&
    !!hoveredCategory &&
    !entries.some(
      (e) => getSetlistEntrySongSpreadCategoryKey(e) === hoveredCategory,
    )

  const guestProxyEntry: SetlistEntry = {
    ...primaryEntry,
    guests: mergedGuests,
  }

  const sharedLastCount = pairSharedLastCount(entries)
  const sharedTourCount = pairSharedTourCount(entries)
  const combinedRarity = pairCombinedRarity(entries)
  const lastBadgeStyle = getLastCountBadgeStyle(sharedLastCount)
  const rarityPillBackground = getRarityPillBackground(combinedRarity)
  const rarityPillBorderColor = getRarityColor(combinedRarity)

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
      {showCanonColumns ?
        <td
          className="last-cell"
          onPointerEnter={isDesktop ? onDataCellPointerEnter : undefined}
        >
          <div className="setlist-cell-inner">
            {sharedLastCount ?
              <SetlistEntryLastCell
                entry={{ ...primaryEntry, last_count: sharedLastCount }}
                lastBadgeStyle={lastBadgeStyle}
                showTooltips={isDesktop}
                useWlHomeV2PillStyle
                tooltipContentClassName={SETLIST_V2_ROW_TOOLTIP_CONTENT.className}
              />
            : <SetlistExpandButton
                onClick={onExpand}
                ariaLabel="Show Last stats for individual songs"
              />
            }
          </div>
        </td>
      : null}
      {showCanonColumns ?
        <td
          className="tour-cell"
          onPointerEnter={isDesktop ? onDataCellPointerEnter : undefined}
        >
          <div className="setlist-cell-inner">
            {sharedTourCount ?
              sharedTourCount
            : <SetlistExpandButton
                onClick={onExpand}
                ariaLabel="Show Tour stats for individual songs"
              />
            }
          </div>
        </td>
      : null}
      {showCanonColumns ?
        <td
          className="rarity-cell"
          onPointerEnter={isDesktop ? onDataCellPointerEnter : undefined}
        >
          <div className="setlist-cell-inner">
            {combinedRarity ?
              isDesktop ?
                <SetlistEntryStatsTooltip entries={entries} wlV2Chrome>
                  <span
                    className={cn(
                      "rare-pill",
                      entriesHaveSongStatsLines(entries) && "cursor-default",
                    )}
                    style={
                      {
                        "--setlist-rare-fill": rarityPillBackground,
                        "--setlist-rare-border": rarityPillBorderColor,
                      } as CSSProperties
                    }
                  >
                    {combinedRarity}
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
                  {combinedRarity}
                </span>
            : <SetlistExpandButton
                onClick={onExpand}
                ariaLabel="Show Rarity stats for individual songs"
              />
            }
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
