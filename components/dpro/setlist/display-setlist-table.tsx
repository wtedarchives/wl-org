"use client"

import { Fragment } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { SetlistEntry } from "@/types/setlist"
import { useIsDesktopContentLayout } from "@/hooks/use-mobile"
import { getEncoreLabel, shouldShowSetBreak } from "@/lib/setlist-utils"
import {
  computeDisplayNumbers,
  shouldShowSetlistEntryShort,
  DISPLAY_SETLIST_TABLE_CELL_PAD,
  jotyRoundDataAttr,
  JOTY_EXPLANATIONS,
  JOTY_ROUND_ORDER,
  LAST_HEADER_TOOLTIP,
  SHORT_EXPLANATIONS,
} from "@/components/dpro/setlist/display-setlist-table.constants"
import { SetlistEntryRow } from "@/components/dpro/setlist/setlist-entry-row"
import { cn } from "@/lib/utils"

import "@/components/dpro/setlist/display-setlist-table.css"

import type { DisplaySetlistTableProps } from "@/components/dpro/setlist/display-setlist-table.props"

export type { DisplaySetlistTableProps } from "@/components/dpro/setlist/display-setlist-table.props"

export function DisplaySetlistTable({
  setlist,
  guestGroups,
  showCanonColumns,
  showWtedColumn,
  onWtedClick,
  onSongClick,
  onJotyClick,
  copiedEntryIds,
  onNumberClick,
  showAdminUi,
  hoveredCategory,
  hoveredReleaseId,
  releaseToEntriesMap,
  rowKeys,
  numberColumnValues,
  plainAscendingNumbers = false,
  suppressPlacementBars = false,
  suppressNumberPlacementColor: suppressNumberPlacementColorProp,
  showDiscographySourceColumn = false,
  discographySourceLabels = [],
  discographyShowColumnCells = [],
}: DisplaySetlistTableProps) {
  if (setlist.length === 0) {
    return null
  }

  const suppressNumberPlacementColor =
    suppressNumberPlacementColorProp !== undefined
      ? suppressNumberPlacementColorProp
      : suppressPlacementBars

  const discographySourceLabelsAligned =
    discographySourceLabels.length === setlist.length
  const discographyShowCellsAligned =
    discographyShowColumnCells.length === setlist.length
  const showDiscographySourceCol =
    showDiscographySourceColumn &&
    discographySourceLabelsAligned &&
    (discographySourceLabels.some((s) => s.trim().length > 0) ||
      (discographyShowCellsAligned &&
        discographyShowColumnCells.some((c) => c != null)))

  const useRowKeys = rowKeys?.length === setlist.length
  const rowKeyAt = (index: number, entry: SetlistEntry) =>
    useRowKeys ? rowKeys![index]! : entry.entry_id

  const isDesktop = useIsDesktopContentLayout()
  const displayNumbers: (number | null)[] =
    numberColumnValues?.length === setlist.length
      ? numberColumnValues
      : plainAscendingNumbers
        ? setlist.map((_, i) => i + 1)
        : computeDisplayNumbers(setlist)
  const uniquePlacements = new Set(setlist.map((e) => e.entry_placement))
  const hasSinglePlacementType = uniquePlacements.size === 1
  const fullColSpan =
    2 +
    (showDiscographySourceCol ? 1 : 0) +
    (showWtedColumn ? 1 : 0) +
    1 +
    (showCanonColumns ? 3 : 0) +
    1 + // Personnel
    1 // Coach's Notes
  const hasLastBadges =
    showCanonColumns &&
    setlist.some((e) => {
      const c = e.last_count ?? ""
      return c.includes("Debut") || c.includes("TD") || c.includes("LIB")
    })

  const hasSegue = setlist.some((e) => !!e.entry_segue)
  const shorts = new Set(
    setlist
      .filter((e) => shouldShowSetlistEntryShort(e.entry_song, e.entry_short))
      .map((e) => e.entry_short?.toLowerCase())
      .filter((s): s is string => !!s && s in SHORT_EXPLANATIONS)
  )
  const jotyRounds = new Set(
    setlist.map((e) => e.joty_round).filter((r): r is string => !!r)
  )
  const hasSongHeaderTooltipItems =
    hasSegue || shorts.size > 0 || jotyRounds.size > 0

  const songHeaderTooltipContent = hasSongHeaderTooltipItems ? (
    <div className="space-y-2 text-xs">
      {hasSegue && (
        <div className="flex items-center gap-1.5">
          <span className="shrink-0 text-red-400">→</span>
          <span>Song segues into the next song without stopping.</span>
        </div>
      )}
      {[...shorts].sort().map((short) => (
        <div key={short}>
          <span className="font-medium text-destructive">[{short}]</span>{" – "}
          {SHORT_EXPLANATIONS[short]}
        </div>
      ))}
      {JOTY_ROUND_ORDER.filter((r) => jotyRounds.has(r)).map((round) => (
        <div key={round} className="flex items-center gap-2">
          <span
            data-joty-round={jotyRoundDataAttr(round)}
            className="display-setlist-header-joty-sample"
          >
            {round}
          </span>
          <span>{JOTY_EXPLANATIONS[round] ?? round}</span>
        </div>
      ))}
    </div>
  ) : null

  return (
    <TooltipProvider delayDuration={0}>
      <div className="w-full overflow-x-auto">
        <Table className="display-setlist-table">
          <TableHeader>
            <TableRow className="h-8 border-border/60 hover:bg-transparent">
              <TableHead
                className={cn(
                  "h-8 w-4 shrink-0 text-center text-muted-foreground",
                  DISPLAY_SETLIST_TABLE_CELL_PAD,
                )}
              >
                #
              </TableHead>
              <TableHead
                className={cn("h-8 text-muted-foreground", DISPLAY_SETLIST_TABLE_CELL_PAD)}
              >
                {hasSongHeaderTooltipItems && isDesktop ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">Song</span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[280px]">
                      {songHeaderTooltipContent}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  "Song"
                )}
              </TableHead>
              {showDiscographySourceCol ? (
                <TableHead
                  className={cn(
                    "h-8 min-w-[9rem] whitespace-nowrap text-left text-muted-foreground",
                    DISPLAY_SETLIST_TABLE_CELL_PAD,
                  )}
                >
                  Show
                </TableHead>
              ) : null}
              {showWtedColumn && (
                <TableHead
                  className={cn(
                    "h-8 text-center text-muted-foreground",
                    DISPLAY_SETLIST_TABLE_CELL_PAD,
                  )}
                >
                  {isDesktop ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">WTED</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        Use the icons below to request songs on WTED Goose Radio.
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    "WTED"
                  )}
                </TableHead>
              )}
              <TableHead
                className={cn(
                  "h-8 text-center text-muted-foreground",
                  DISPLAY_SETLIST_TABLE_CELL_PAD,
                )}
              >
                Time
              </TableHead>
              {showCanonColumns && (
                <TableHead
                  className={cn(
                    "h-8 text-center text-muted-foreground",
                    DISPLAY_SETLIST_TABLE_CELL_PAD,
                  )}
                >
                  {hasLastBadges && isDesktop ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">Last</span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[240px] whitespace-pre-wrap text-xs">
                        {LAST_HEADER_TOOLTIP}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    "Last"
                  )}
                </TableHead>
              )}
              {showCanonColumns && (
                <TableHead
                  className={cn(
                    "h-8 text-center text-muted-foreground",
                    DISPLAY_SETLIST_TABLE_CELL_PAD,
                  )}
                >
                  Tour
                </TableHead>
              )}
              {showCanonColumns && (
                <TableHead
                  className={cn(
                    "h-8 text-center text-muted-foreground",
                    DISPLAY_SETLIST_TABLE_CELL_PAD,
                  )}
                >
                  Rarity
                </TableHead>
              )}
              <TableHead
                className={cn(
                  "h-8 w-max max-w-[300px] text-muted-foreground",
                  DISPLAY_SETLIST_TABLE_CELL_PAD,
                )}
              >
                Personnel
              </TableHead>
              <TableHead
                className={cn(
                  "h-8 w-max max-w-[400px] text-muted-foreground",
                  DISPLAY_SETLIST_TABLE_CELL_PAD,
                  "py-[1px]",
                )}
              >
                Coach&apos;s Notes
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {setlist.map((entry, index) => {
              const prevEntry = index > 0 ? setlist[index - 1] : null
              const showEncoreBar =
                !suppressPlacementBars &&
                !hasSinglePlacementType &&
                prevEntry &&
                entry.entry_set?.startsWith("E") &&
                (!prevEntry.entry_set?.startsWith("E") ||
                  prevEntry.entry_set !== entry.entry_set) &&
                !!getEncoreLabel(entry.entry_set)
              const showSetBreakBar =
                !suppressPlacementBars &&
                !hasSinglePlacementType &&
                prevEntry &&
                shouldShowSetBreak(prevEntry.entry_set, entry.entry_set)
              const rowKey = rowKeyAt(index, entry)
              return (
                <Fragment key={rowKey}>
                  {showEncoreBar && (
                    <TableRow
                      key={`encore-${rowKey}`}
                      className="border-border/60 hover:bg-transparent"
                    >
                      <TableCell
                        colSpan={fullColSpan}
                        className="border-y border-border bg-gray-700 px-0 py-[2px] text-center text-[0.625rem] font-medium text-foreground"
                      >
                        {getEncoreLabel(entry.entry_set)}
                      </TableCell>
                    </TableRow>
                  )}
                  {showSetBreakBar && (
                    <TableRow
                      key={`setbreak-${rowKey}`}
                      className="border-border/60 hover:bg-transparent"
                    >
                      <TableCell
                        colSpan={fullColSpan}
                        className="border-y border-border bg-gray-800 px-0 py-[2px] text-center text-[0.625rem] font-medium text-foreground"
                      >
                        Set Break
                      </TableCell>
                    </TableRow>
                  )}
                  <SetlistEntryRow
                    entry={entry}
                    displayNumber={displayNumbers[index]}
                    guestGroups={guestGroups}
                    showCanonColumns={showCanonColumns}
                    showWtedColumn={showWtedColumn}
                    onWtedClick={onWtedClick}
                    onSongClick={onSongClick}
                    onJotyClick={onJotyClick}
                    copiedEntryIds={copiedEntryIds}
                    onNumberClick={onNumberClick}
                    showAdminUi={showAdminUi}
                    showTooltips={isDesktop}
                    hoveredCategory={hoveredCategory}
                    hoveredReleaseId={hoveredReleaseId}
                    releaseToEntriesMap={releaseToEntriesMap}
                    suppressNumberPlacementColor={suppressNumberPlacementColor}
                    discographySourceLabel={
                      showDiscographySourceCol
                        ? (discographySourceLabels[index] ?? "")
                        : undefined
                    }
                    discographyShowCell={
                      showDiscographySourceCol && discographyShowCellsAligned
                        ? (discographyShowColumnCells[index] ?? null)
                        : undefined
                    }
                  />
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  )
}