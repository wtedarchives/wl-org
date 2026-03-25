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
import type { SetlistEntry, GuestGroup } from "@/types/setlist"
import type { ReleaseToEntriesMap } from "@/hooks/use-setlist-releases"
import { useIsDesktopContentLayout } from "@/hooks/use-mobile"
import { getEncoreLabel, shouldShowSetBreak } from "@/lib/setlist-utils"
import {
  computeDisplayNumbers,
  getJotyBadgeStyle,
  JOTY_EXPLANATIONS,
  JOTY_ROUND_ORDER,
  LAST_HEADER_TOOLTIP,
  SHORT_EXPLANATIONS,
} from "@/components/dpro/setlist/display-setlist-table.constants"
import { SetlistEntryRow } from "@/components/dpro/setlist/setlist-entry-row"

export interface DisplaySetlistTableProps {
  setlist: SetlistEntry[]
  guestGroups: GuestGroup[]
  /** When true, show Last, Tour, and Rarity columns (show has canon id). */
  showCanonColumns: boolean
  showWtedColumn: boolean
  onWtedClick?: (entry: SetlistEntry) => void
  onSongClick?: (entry: SetlistEntry) => void
  onJotyClick?: (entry: SetlistEntry) => void
  /** When admin clicks # cell, entry_id is copied and added here for ~2s to show checkmark. */
  copiedEntryIds?: Set<string>
  /** Called when admin clicks the # cell; copies entry_id to clipboard. */
  onNumberClick?: (entryId: string) => void
  /** When true, # cell is clickable to copy entry ID. */
  showAdminUi?: boolean
  /** When set, rows matching this category are highlighted; others are dimmed. */
  hoveredCategory?: string | null
  /** When set, rows on this release are highlighted; others dimmed (overrides category). */
  hoveredReleaseId?: string | null
  /** release_id -> Set of setlist entry_ids on that release (from setlist_entry_media). */
  releaseToEntriesMap?: ReleaseToEntriesMap
  /** When length matches `setlist`, used as row keys (e.g. discography link UUIDs when the same entry appears twice). */
  rowKeys?: string[]
  /** When length matches `setlist`, # column shows these values (e.g. `discography_entries.order`). */
  numberColumnValues?: number[]
  /** # column is 1… every row (no blanks or skips). Ignored when `numberColumnValues` is provided. */
  plainAscendingNumbers?: boolean
  /** Hide Set Break / Encore divider rows (e.g. when rows come from multiple shows). */
  suppressPlacementBars?: boolean
  /** Request extra column after Personnel (hidden automatically if every label is blank). */
  showDiscographySourceColumn?: boolean
  /** Parallel to `setlist`; cell shows `mm.dd.yy [venue]` when the show has `discography_display`. */
  discographySourceLabels?: string[]
}

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
  showDiscographySourceColumn = false,
  discographySourceLabels = [],
}: DisplaySetlistTableProps) {
  if (setlist.length === 0) {
    return null
  }

  const discographySourceLabelsAligned =
    discographySourceLabels.length === setlist.length
  const showDiscographySourceCol =
    showDiscographySourceColumn &&
    discographySourceLabelsAligned &&
    discographySourceLabels.some((s) => s.trim().length > 0)

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
    (showWtedColumn ? 1 : 0) +
    1 +
    (showCanonColumns ? 3 : 0) +
    1 +
    (showDiscographySourceCol ? 1 : 0) // #, Song, WTED?, Time, Last+Tour+Rarity?, Personnel, Source?
  const hasLastBadges =
    showCanonColumns &&
    setlist.some((e) => {
      const c = e.last_count ?? ""
      return c.includes("Debut") || c.includes("TD") || c.includes("LIB")
    })

  const hasSegue = setlist.some((e) => !!e.entry_segue)
  const shorts = new Set(
    setlist
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
      {JOTY_ROUND_ORDER.filter((r) => jotyRounds.has(r)).map((round) => {
        const jotyStyle = getJotyBadgeStyle(round)
        return (
          <div key={round} className="flex items-center gap-2">
            <span style={jotyStyle.style} className={jotyStyle.className}>
              {round}
            </span>
            <span>{JOTY_EXPLANATIONS[round] ?? round}</span>
          </div>
        )
      })}
    </div>
  ) : null

  return (
    <TooltipProvider delayDuration={0}>
      <div className="w-full overflow-x-auto">
        <Table className="[&_th]:py-1 [&_th]:px-2 [&_th]:align-middle [&_td]:py-0.5 [&_td]:px-2 [&_td]:align-middle">
          <TableHeader>
            <TableRow className="h-8 border-border/60 hover:bg-transparent">
              <TableHead className="h-8 w-4 shrink-0 text-center text-muted-foreground">
                #
              </TableHead>
              <TableHead className="h-8 max-w-[470px] text-muted-foreground">
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
              {showWtedColumn && (
                <TableHead className="h-8 text-center text-muted-foreground">
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
              <TableHead className="h-8 text-center text-muted-foreground">
                Time
              </TableHead>
              {showCanonColumns && (
                <TableHead className="h-8 text-center text-muted-foreground">
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
                <TableHead className="h-8 text-center text-muted-foreground">
                  Tour
                </TableHead>
              )}
              {showCanonColumns && (
                <TableHead className="h-8 text-center text-muted-foreground">
                  Rarity
                </TableHead>
              )}
              <TableHead className="h-8 min-w-[400px] max-w-[600px] text-muted-foreground">
                Personnel
              </TableHead>
              {showDiscographySourceCol ? (
                <TableHead className="h-8 min-w-[9rem] max-w-[14rem] text-left text-muted-foreground">
                  Show
                </TableHead>
              ) : null}
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
                        className="border-y border-border bg-gray-700 !px-0 !py-0.5 text-center text-[0.625rem] font-medium text-foreground"
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
                        className="border-y border-border bg-gray-800 !px-0 !py-0.5 text-center text-[0.625rem] font-medium text-foreground"
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
                    discographySourceLabel={
                      showDiscographySourceCol
                        ? (discographySourceLabels[index] ?? "")
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
