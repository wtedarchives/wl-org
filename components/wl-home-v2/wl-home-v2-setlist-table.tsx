"use client"

import { Fragment, useMemo, useState } from "react"

import {
  computeDisplayNumbers,
  JOTY_ROUND_ORDER,
  SHORT_EXPLANATIONS,
  shouldShowSetlistEntryShort,
} from "@/components/dpro/setlist/display-setlist-table.constants"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useIsDesktopContentLayout } from "@/hooks/use-mobile"
import { formatEntryLength, getEncoreLabel, shouldShowSetBreak } from "@/lib/setlist-utils"

import {
  SETLIST_HEADER_TOOLTIP_CONTENT,
} from "@/components/wl-home-v2/wl-home-v2-setlist-table.constants"
import { WlHomeV2SetlistCoachCallbacksFooter } from "@/components/wl-home-v2/wl-home-v2-setlist-coach-callbacks-footer"
import {
  WlHomeV2LastHeaderTooltipBody,
  WlHomeV2SetlistSongHeaderTooltipBody,
} from "@/components/wl-home-v2/wl-home-v2-setlist-table-header-tooltips"
import { WlHomeV2SetlistTableRow } from "@/components/wl-home-v2/wl-home-v2-setlist-table-row"

import type { ReleaseToEntriesMap } from "@/hooks/use-setlist-releases"
import type { SetlistEntry, Show } from "@/types/setlist"

export function WlHomeV2SetlistTable({
  show,
  setlist,
  showAdminUi,
  copiedEntryIds,
  onNumberClick,
  onJotyBadgeClick,
  onSongClick,
  onWtedClick,
  hoveredReleaseId,
  releaseToEntriesMap,
  hoveredCategory,
}: {
  show: Show
  setlist: SetlistEntry[]
  showAdminUi?: boolean
  copiedEntryIds?: Set<string>
  onNumberClick?: (entryId: string) => void
  onJotyBadgeClick?: (entry: SetlistEntry) => void
  onSongClick?: (entry: SetlistEntry) => void
  onWtedClick?: (entry: SetlistEntry) => void
  hoveredReleaseId?: string | null
  releaseToEntriesMap?: ReleaseToEntriesMap
  hoveredCategory?: string | null
}) {
  const [hoveredEntryId, setHoveredEntryId] = useState<string | null>(null)
  const isDesktop = useIsDesktopContentLayout()
  const showCanonColumns = show.show_canonid != null
  const showWtedColumn = setlist.some((e) => !!e.radio_id)
  const showTimeColumn = setlist.some(
    (e) => (formatEntryLength(e.entry_length) ?? "") !== "",
  )
  const showCoachColumn = setlist.some(
    (e) => !!e.entry_coachnotes?.trim(),
  )
  const displayNumbers = computeDisplayNumbers(setlist)
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
          <thead>
            <tr>
              {showDiscographySetUi ?
                <th
                  className="set-section-rail-head"
                  scope="col"
                  aria-hidden={true}
                />
              : null}
              <th className="center num-col">#</th>
              <th>
                {hasSongHeaderTooltipItems && isDesktop ?
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="setlist-th-help">Song</span>
                    </TooltipTrigger>
                    <TooltipContent
                      className="setlist-header-tooltip"
                      {...SETLIST_HEADER_TOOLTIP_CONTENT}
                    >
                      <WlHomeV2SetlistSongHeaderTooltipBody
                        hasSegue={hasSegue}
                        sortedShorts={sortedShorts}
                        jotyRoundsInOrder={jotyRoundsInOrder}
                        shortLabelByKey={shortLabelByKey}
                      />
                    </TooltipContent>
                  </Tooltip>
                : "Song"}
              </th>
              {showWtedColumn ?
                <th className="center">
                  {isDesktop ?
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="setlist-th-help">WTED</span>
                      </TooltipTrigger>
                      <TooltipContent
                        className="setlist-header-tooltip setlist-header-tooltip--tight"
                        {...SETLIST_HEADER_TOOLTIP_CONTENT}
                      >
                        Use the icons below to request songs on WTED Goose Radio.
                      </TooltipContent>
                    </Tooltip>
                  : "WTED"}
                </th>
              : null}
              {showTimeColumn ?
                <th className="center">Time</th>
              : null}
              {showCanonColumns ?
                <th className="center">
                  {hasLastHeaderTooltip && isDesktop ?
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="setlist-th-help">Last</span>
                      </TooltipTrigger>
                      <TooltipContent
                        className="setlist-header-tooltip setlist-header-tooltip--last"
                        {...SETLIST_HEADER_TOOLTIP_CONTENT}
                      >
                        <WlHomeV2LastHeaderTooltipBody />
                      </TooltipContent>
                    </Tooltip>
                  : "Last"}
                </th>
              : null}
              {showCanonColumns ?
                <th className="center">Tour</th>
              : null}
              {showCanonColumns ?
                <th className="center">Rarity</th>
              : null}
              <th>Personnel</th>
              {showCoachColumn ?
                <th className="set-table-coach-notes-head">
                  Coach&apos;s Notes
                </th>
              : null}
            </tr>
          </thead>
          <tbody>
            {setlist.map((entry, index) => {
              const prevEntry = index > 0 ? setlist[index - 1]! : null
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

              const isFirstOfRun =
                index === 0 ||
                setlist[index - 1]!.entry_set !== entry.entry_set
              let runSpan = 1
              if (isFirstOfRun) {
                for (let j = index + 1; j < setlist.length; j++) {
                  if (setlist[j]!.entry_set === entry.entry_set) runSpan++
                  else break
                }
              }

              return (
                <Fragment key={entry.entry_id}>
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
                  <WlHomeV2SetlistTableRow
                    entry={entry}
                    displayNumber={displayNumbers[index] ?? null}
                    showCanonColumns={showCanonColumns}
                    showWtedColumn={showWtedColumn}
                    showTimeColumn={showTimeColumn}
                    showCoachColumn={showCoachColumn}
                    isDesktop={isDesktop}
                    isFirstOfRun={isFirstOfRun}
                    runSpan={runSpan}
                    isRowHovered={hoveredEntryId === entry.entry_id}
                    onDataCellPointerEnter={() =>
                      setHoveredEntryId(entry.entry_id)
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
                  />
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
