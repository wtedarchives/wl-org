"use client"

import { Fragment, useMemo, useState } from "react"

import {
  JOTY_ROUND_ORDER,
  SHORT_EXPLANATIONS,
  shouldShowSetlistEntryShort,
} from "@/components/dpro/setlist/display-setlist-table.constants"
import {
  buildSetlistTableRows,
  computeDisplayNumbersForTableRows,
  tableRowEntryIds,
  tableRowEntrySet,
  tableRowPrimaryEntry,
} from "@/lib/song-pairs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useIsDesktopContentLayout } from "@/hooks/use-mobile"
import { useSetlistPairExpansion } from "@/hooks/use-setlist-pair-expansion"
import { formatEntryLength, getEncoreLabel, shouldShowSetBreak } from "@/lib/setlist-utils"

import { WlHomeV2SetlistCoachCallbacksFooter } from "@/components/wl-home-v2/wl-home-v2-setlist-coach-callbacks-footer"
import { WlHomeV2SetlistPairTableRow } from "@/components/wl-home-v2/wl-home-v2-setlist-pair-table-row"
import { WlHomeV2SetlistTableHead } from "@/components/wl-home-v2/wl-home-v2-setlist-table-head"
import { WlHomeV2SetlistTableRow } from "@/components/wl-home-v2/wl-home-v2-setlist-table-row"

import type { ReleaseToEntriesMap } from "@/hooks/use-setlist-releases"
import type { SetlistEntry, Show } from "@/types/setlist"
import type { SongPair } from "@/types/song-pair"

export function WlHomeV2SetlistTable({
  show,
  setlist,
  songPairs,
  showAdminUi,
  copiedEntryIds,
  onNumberClick,
  onJotyBadgeClick,
  onSongClick,
  onPairSongClick,
  onWtedClick,
  onPairWtedClick,
  hoveredReleaseId,
  releaseToEntriesMap,
  hoveredCategory,
}: {
  show: Show
  setlist: SetlistEntry[]
  songPairs: SongPair[]
  showAdminUi?: boolean
  copiedEntryIds?: Set<string>
  onNumberClick?: (entryId: string) => void
  onJotyBadgeClick?: (entry: SetlistEntry) => void
  onSongClick?: (entry: SetlistEntry) => void
  onPairSongClick?: (
    entries: SetlistEntry[],
    pair: import("@/types/song-pair").SongPair,
  ) => void
  onWtedClick?: (entry: SetlistEntry) => void
  onPairWtedClick?: (entries: SetlistEntry[]) => void
  hoveredReleaseId?: string | null
  releaseToEntriesMap?: ReleaseToEntriesMap
  hoveredCategory?: string | null
}) {
  const [hoveredEntryId, setHoveredEntryId] = useState<string | null>(null)
  const {
    expandedPairKeys,
    expandPair,
    expandPairFromCoachNotes,
    isCoachNotesExpanded,
  } = useSetlistPairExpansion(show.show_id)
  const isDesktop = useIsDesktopContentLayout()

  const showCanonColumns = show.show_canonid != null
  const showWtedColumn = setlist.some((e) => !!e.radio_id)
  const showTimeColumn = setlist.some(
    (e) => (formatEntryLength(e.entry_length) ?? "") !== "",
  )
  const showCoachColumn = setlist.some(
    (e) => !!e.entry_coachnotes?.trim(),
  )
  const tableRows = useMemo(
    () => buildSetlistTableRows(setlist, songPairs, expandedPairKeys),
    [setlist, songPairs, expandedPairKeys],
  )
  const displayNumbers = useMemo(
    () => computeDisplayNumbersForTableRows(tableRows),
    [tableRows],
  )
  const uniquePlacements = new Set(setlist.map((e) => e.entry_placement))
  const hasSinglePlacementType = uniquePlacements.size === 1

  const hasSegue = setlist.some((e) => !!e.entry_segue)
  const entryShortKeys = new Set(
    setlist
      .filter((e) => shouldShowSetlistEntryShort(e.entry_song, e.entry_short))
      .map((e) => e.entry_short?.toLowerCase())
      .filter((s): s is string => !!s && s in SHORT_EXPLANATIONS),
  )
  const jotyRoundSet = new Set(
    setlist.map((e) => e.joty_round).filter((r): r is string => !!r),
  )
  const hasSongHeaderTooltipItems =
    hasSegue || entryShortKeys.size > 0 || jotyRoundSet.size > 0
  const jotyRoundsInOrder = JOTY_ROUND_ORDER.filter((r) => jotyRoundSet.has(r))
  const sortedShorts = [...entryShortKeys].sort()

  const shortLabelByKey = useMemo(() => {
    const m = new Map<string, string>()
    for (const e of setlist) {
      if (!shouldShowSetlistEntryShort(e.entry_song, e.entry_short)) continue
      const raw = e.entry_short?.trim()
      if (!raw) continue
      const k = raw.toLowerCase()
      if (k in SHORT_EXPLANATIONS && !m.has(k)) m.set(k, raw)
    }
    return m
  }, [setlist])

  const hasLastHeaderTooltip =
    showCanonColumns &&
    setlist.some((e) => {
      const c = e.last_count ?? ""
      return c.includes("Debut") || c.includes("TD") || c.includes("LIB")
    })

  const callbacksText = show.show_callbacks?.trim() ?? ""
  const coachNotesShowText = show.show_coachnotes?.trim() ?? ""

  const showDiscographySetUi = show.discography_display !== false

  const fullColSpan =
    (showDiscographySetUi ? 1 : 0) +
    1 +
    1 +
    (showWtedColumn ? 1 : 0) +
    (showTimeColumn ? 1 : 0) +
    (showCanonColumns ? 3 : 0) +
    1 +
    (showCoachColumn ? 1 : 0)

  if (setlist.length === 0) {
    const hasCoach = coachNotesShowText.length > 0
    const hasCallbacks = callbacksText.length > 0
    if (!hasCoach && !hasCallbacks) return null

    return (
      <div className="setlist-card wl-home-v2-setlist-card">
        <WlHomeV2SetlistCoachCallbacksFooter
          coachNotesHtml={coachNotesShowText}
          callbacksHtml={callbacksText}
          showDividerAfterTable={false}
        />
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="setlist-card wl-home-v2-setlist-card">
        <div className="wl-home-v2-setlist-table-scroll">
          <table
            className="set-table"
            onPointerLeave={
              isDesktop ? () => setHoveredEntryId(null) : undefined
            }
          >
            <WlHomeV2SetlistTableHead
              showDiscographySetUi={showDiscographySetUi}
              showWtedColumn={showWtedColumn}
              showTimeColumn={showTimeColumn}
              showCanonColumns={showCanonColumns}
              showCoachColumn={showCoachColumn}
              isDesktop={isDesktop}
              hasSongHeaderTooltipItems={hasSongHeaderTooltipItems}
              hasSegue={hasSegue}
              sortedShorts={sortedShorts}
              jotyRoundsInOrder={jotyRoundsInOrder}
              shortLabelByKey={shortLabelByKey}
              hasLastHeaderTooltip={hasLastHeaderTooltip}
            />
            <tbody>
              {tableRows.map((row, index) => {
                const entry = tableRowPrimaryEntry(row)
                const prevEntry =
                  index > 0 ? tableRowPrimaryEntry(tableRows[index - 1]!) : null
                const showEncoreBar =
                  showDiscographySetUi &&
                  !hasSinglePlacementType &&
                  prevEntry &&
                  entry.entry_set?.startsWith("E") &&
                  (!prevEntry.entry_set?.startsWith("E") ||
                    prevEntry.entry_set !== entry.entry_set) &&
                  !!getEncoreLabel(entry.entry_set)
                const showSetBreakBar =
                  showDiscographySetUi &&
                  !hasSinglePlacementType &&
                  prevEntry &&
                  shouldShowSetBreak(prevEntry.entry_set, entry.entry_set)

                const rowSet = tableRowEntrySet(row)
                const isFirstOfRun =
                  index === 0 ||
                  tableRowEntrySet(tableRows[index - 1]!) !== rowSet
                let runSpan = 1
                if (isFirstOfRun) {
                  for (let j = index + 1; j < tableRows.length; j++) {
                    if (tableRowEntrySet(tableRows[j]!) === rowSet) runSpan++
                    else break
                  }
                }

                const rowHoverIds = tableRowEntryIds(row)
                const isRowHovered = rowHoverIds.includes(hoveredEntryId ?? "")
                const rowKey =
                  row.type === "single" ? row.entry.entry_id : row.expandKey

                return (
                  <Fragment key={rowKey}>
                    {showEncoreBar ?
                      <tr
                        className="set-divider-row set-divider-row--encore"
                        aria-hidden={true}
                      >
                        <td className="set-divider-cell" colSpan={fullColSpan} />
                      </tr>
                    : null}
                    {showSetBreakBar ?
                      <tr className="set-divider-row" aria-hidden={true}>
                        <td className="set-divider-cell" colSpan={fullColSpan} />
                      </tr>
                    : null}
                    {row.type === "pair" ?
                      <WlHomeV2SetlistPairTableRow
                        pair={row.pair}
                        entries={row.entries}
                        displayNumber={displayNumbers[index] ?? null}
                        showCanonColumns={showCanonColumns}
                        showWtedColumn={showWtedColumn}
                        showTimeColumn={showTimeColumn}
                        showCoachColumn={showCoachColumn}
                        isDesktop={isDesktop}
                        isFirstOfRun={isFirstOfRun}
                        runSpan={runSpan}
                        isRowHovered={isRowHovered}
                        onDataCellPointerEnter={() =>
                          setHoveredEntryId(row.entries[0]!.entry_id)
                        }
                        onSetRailPointerEnter={() => setHoveredEntryId(null)}
                        onExpand={() => expandPair(row.expandKey)}
                        onCoachNotesExpand={() =>
                          expandPairFromCoachNotes(row.expandKey, row.entries)
                        }
                        onJotyBadgeClick={onJotyBadgeClick}
                        onSongClick={onPairSongClick ?
                            (entries) => onPairSongClick(entries, row.pair)
                          : undefined}
                        onWtedClick={onPairWtedClick}
                        showAdminUi={showAdminUi}
                        copiedEntryIds={copiedEntryIds}
                        onNumberClick={onNumberClick}
                        hoveredReleaseId={hoveredReleaseId}
                        releaseToEntriesMap={releaseToEntriesMap}
                        hoveredCategory={hoveredCategory}
                        showDiscographySetUi={showDiscographySetUi}
                      />
                    : <WlHomeV2SetlistTableRow
                        entry={row.entry}
                        displayNumber={displayNumbers[index] ?? null}
                        showCanonColumns={showCanonColumns}
                        showWtedColumn={showWtedColumn}
                        showTimeColumn={showTimeColumn}
                        showCoachColumn={showCoachColumn}
                        isDesktop={isDesktop}
                        isFirstOfRun={isFirstOfRun}
                        runSpan={runSpan}
                        isRowHovered={isRowHovered}
                        onDataCellPointerEnter={() =>
                          setHoveredEntryId(row.entry.entry_id)
                        }
                        onSetRailPointerEnter={() => setHoveredEntryId(null)}
                        onJotyBadgeClick={onJotyBadgeClick}
                        onSongClick={onSongClick}
                        onWtedClick={onWtedClick}
                        showAdminUi={showAdminUi}
                        copiedEntryIds={copiedEntryIds}
                        onNumberClick={onNumberClick}
                        hoveredReleaseId={hoveredReleaseId}
                        releaseToEntriesMap={releaseToEntriesMap}
                        hoveredCategory={hoveredCategory}
                        showDiscographySetUi={showDiscographySetUi}
                        coachNotesExpanded={isCoachNotesExpanded(
                          row.entry.entry_id,
                        )}
                      />
                    }
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
        <WlHomeV2SetlistCoachCallbacksFooter
          coachNotesHtml={coachNotesShowText}
          callbacksHtml={callbacksText}
        />
      </div>
    </TooltipProvider>
  )
}
