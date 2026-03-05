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
}: DisplaySetlistTableProps) {
  if (setlist.length === 0) {
    return null
  }

  const isDesktop = useIsDesktopContentLayout()
  const displayNumbers = computeDisplayNumbers(setlist)
  const uniquePlacements = new Set(setlist.map((e) => e.entry_placement))
  const hasSinglePlacementType = uniquePlacements.size === 1
  const fullColSpan =
    2 + (showWtedColumn ? 1 : 0) + 1 + (showCanonColumns ? 3 : 0) + 2 // #, Song, WTED?, Time, Last+Tour+Rarity?, Personnel, Coach
  const hasLastBadges = showCanonColumns && setlist.some((e) => {
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
            <span
              style={jotyStyle.style}
              className={jotyStyle.className}
            >
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
        <Table className="[&_th]:py-1 [&_th]:px-2 [&_td]:py-1 [&_td]:px-2">
        <TableHeader>
          <TableRow className="h-8 border-border/60 hover:bg-transparent">
            <TableHead className="h-8 w-4 shrink-0 text-center text-muted-foreground">#</TableHead>
            <TableHead className="h-8 text-muted-foreground">
              {hasSongHeaderTooltipItems ? (
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help">WTED</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Use the icons below to request songs on WTED Goose Radio.
                  </TooltipContent>
                </Tooltip>
              </TableHead>
            )}
            <TableHead className="h-8 text-center text-muted-foreground">Time</TableHead>
            {showCanonColumns && (
              <TableHead className="h-8 text-center text-muted-foreground">
                {hasLastBadges ? (
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
              <TableHead className="h-8 text-center text-muted-foreground">Tour</TableHead>
            )}
            {showCanonColumns && (
              <TableHead className="h-8 text-center text-muted-foreground">Rarity</TableHead>
            )}
            <TableHead className="h-8 min-w-[225px] max-w-[400px] text-muted-foreground">
              Personnel
            </TableHead>
            <TableHead className="h-8 min-w-[400px] max-w-[400px] text-muted-foreground">
              Coach&apos;s Notes
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {setlist.map((entry, index) => {
            const prevEntry = index > 0 ? setlist[index - 1] : null
            const showEncoreBar =
              !hasSinglePlacementType &&
              prevEntry &&
              entry.entry_set?.startsWith("E") &&
              (!prevEntry.entry_set?.startsWith("E") ||
                prevEntry.entry_set !== entry.entry_set) &&
              !!getEncoreLabel(entry.entry_set)
            const showSetBreakBar =
              !hasSinglePlacementType &&
              prevEntry &&
              shouldShowSetBreak(prevEntry.entry_set, entry.entry_set)
            return (
              <Fragment key={entry.entry_id}>
                {showEncoreBar && (
                  <TableRow
                    key={`encore-${entry.entry_id}`}
                    className="hover:bg-transparent border-border/60"
                  >
                    <TableCell
                      colSpan={fullColSpan}
                      className="border-y border-border bg-red-800/30 py-1 text-center text-[0.625rem] font-medium text-foreground"
                    >
                      {getEncoreLabel(entry.entry_set)}
                    </TableCell>
                  </TableRow>
                )}
                {showSetBreakBar && (
                  <TableRow
                    key={`setbreak-${entry.entry_id}`}
                    className="hover:bg-transparent border-border/60"
                  >
                    <TableCell
                      colSpan={fullColSpan}
                      className="border-y border-border bg-gray-300 py-1 text-center text-[0.625rem] font-medium text-foreground dark:bg-gray-600"
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
                  showSongRowTooltip={isDesktop}
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
