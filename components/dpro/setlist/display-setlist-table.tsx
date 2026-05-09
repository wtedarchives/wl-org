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
import { SETLIST_HEADER_TOOLTIP_CONTENT } from "@/components/wl-home-v2/wl-home-v2-setlist-table.constants"

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
  wlHomeV2SetlistTableChrome = false,
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

  const wlHdr = wlHomeV2SetlistTableChrome
  const hdrPad = DISPLAY_SETLIST_TABLE_CELL_PAD

  const displayTable = (
    <Table
      className={cn(
        "display-setlist-table",
        wlHomeV2SetlistTableChrome && "set-table",
      )}
    >
          <TableHeader>
            <TableRow
              className={cn(
                "hover:bg-transparent",
                wlHdr ? "border-0 !h-auto min-h-0" : "h-8 border-border/60",
              )}
            >
              <TableHead
                className={cn(
                  hdrPad,
                  wlHdr && "center num-col shrink-0 text-center",
                  !wlHdr &&
                    "h-8 w-4 shrink-0 text-center text-muted-foreground",
                )}
              >
                #
              </TableHead>
              <TableHead
                className={cn(hdrPad, !wlHdr && "h-8 text-muted-foreground")}
              >
                {hasSongHeaderTooltipItems && isDesktop ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className={cn(!wlHdr && "cursor-help", wlHdr && "setlist-th-help")}
                      >
                        Song
                      </span>
                    </TooltipTrigger>
                    <TooltipContent
                      className={cn(
                        "max-w-[280px]",
                        wlHdr && "setlist-header-tooltip",
                      )}
                      {...(wlHdr ? SETLIST_HEADER_TOOLTIP_CONTENT : {})}
                    >
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
                    hdrPad,
                    "min-w-[9rem] whitespace-nowrap text-left",
                    !wlHdr && "h-8 text-muted-foreground",
                  )}
                >
                  Show
                </TableHead>
              ) : null}
              {showWtedColumn && (
                <TableHead
                  className={cn(
                    hdrPad,
                    "text-center",
                    wlHdr && "center",
                    !wlHdr && "h-8 text-muted-foreground",
                  )}
                >
                  {isDesktop ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className={cn(!wlHdr && "cursor-help", wlHdr && "setlist-th-help")}
                        >
                          WTED
                        </span>
                      </TooltipTrigger>
                      <TooltipContent
                        {...(wlHdr ?
                          {
                            ...SETLIST_HEADER_TOOLTIP_CONTENT,
                            className:
                              "setlist-header-tooltip setlist-header-tooltip--tight",
                          }
                        : {})}
                      >
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
                  hdrPad,
                  "text-center",
                  wlHdr && "center",
                  !wlHdr && "h-8 text-muted-foreground",
                )}
              >
                Time
              </TableHead>
              {showCanonColumns && (
                <TableHead
                  className={cn(
                    hdrPad,
                    wlHdr ? "center" : "text-center",
                    !wlHdr && "h-8 text-muted-foreground",
                  )}
                >
                  {hasLastBadges && isDesktop ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className={cn(!wlHdr && "cursor-help", wlHdr && "setlist-th-help")}
                        >
                          Last
                        </span>
                      </TooltipTrigger>
                      <TooltipContent
                        {...(wlHdr ? SETLIST_HEADER_TOOLTIP_CONTENT : {})}
                        className={cn(
                          "max-w-[240px] whitespace-pre-wrap text-xs",
                          wlHdr &&
                            "setlist-header-tooltip setlist-header-tooltip--last",
                        )}
                      >
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
                    hdrPad,
                    wlHdr ? "center text-center" : "text-center",
                    !wlHdr && "h-8 text-muted-foreground",
                  )}
                >
                  Tour
                </TableHead>
              )}
              {showCanonColumns && (
                <TableHead
                  className={cn(
                    hdrPad,
                    wlHdr ? "center text-center" : "text-center",
                    !wlHdr && "h-8 text-muted-foreground",
                  )}
                >
                  Rarity
                </TableHead>
              )}
              <TableHead
                className={cn(
                  hdrPad,
                  wlHdr ?
                    cn("max-w-[400px] whitespace-normal")
                  : cn("h-8 w-max max-w-[300px] text-muted-foreground"),
                )}
              >
                Personnel
              </TableHead>
              <TableHead
                className={cn(
                  hdrPad,
                  wlHdr ?
                    "set-table-coach-notes-head max-w-[400px]"
                  : cn(
                      "h-8 w-max max-w-[400px] text-muted-foreground",
                      "py-[1px]",
                    ),
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
                    wlHomeV2RowChrome={wlHomeV2SetlistTableChrome}
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
  )

  return (
    <TooltipProvider delayDuration={0}>
      {wlHomeV2SetlistTableChrome ?
        displayTable
      : <div className="w-full overflow-x-auto">{displayTable}</div>}
    </TooltipProvider>
  )
}