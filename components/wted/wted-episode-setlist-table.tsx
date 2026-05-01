"use client"

import { type ReactNode } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { WtedEpisodeTableRow } from "@/types/wted-episode"
import { getPlacementBarCssToken } from "@/lib/placement-bar-color"
import { getEncoreLabel, shouldShowSetBreak } from "@/lib/setlist-utils"
import {
  TooltipProvider,
} from "@/components/ui/tooltip"
import type { SetlistEntry } from "@/types/setlist"
import { wtedEpisodeShowGroupKey } from "@/lib/wted-episode-show-group"

import "@/components/dpro/setlist/display-setlist-table.css"
import { useIsDesktopContentLayout } from "@/hooks/use-mobile"
import { WtedEpisodeSetlistDataRow } from "@/components/wted/wted-episode-setlist-data-row"
import { WtedEpisodeSetlistTableHead } from "@/components/wted/wted-episode-setlist-table-head"

export function WtedEpisodeSetlistTable({
  rows,
  hoveredCategory = null,
  hoveredPerformanceYear = null,
  hoveredShowGroupKey = null,
  onWtedClick,
  onJotyClick,
}: {
  rows: WtedEpisodeTableRow[]
  /** When set, highlights matching song categories and dims others (song spread hover). */
  hoveredCategory?: string | null
  /** When set, highlights rows whose adjoining show date is in this year (performance spread hover). */
  hoveredPerformanceYear?: string | null
  /** When set, highlights rows whose adjoining show matches this normalized `show_group` (group spread hover). */
  hoveredShowGroupKey?: string | null
  /** Opens WTED request sheet (logged in) or login dialog (guest). */
  onWtedClick?: (entry: SetlistEntry) => void
  /** Opens the same JOTY drawer as the setlist archive page. */
  onJotyClick?: (entry: SetlistEntry) => void
}) {
  const router = useRouter()
  const isDesktop = useIsDesktopContentLayout()
  const showGroupColumn = rows.some(
    (r) => r.showGroup != null && r.showGroup !== "Goose",
  )
  const showWtedColumn = rows.some((r) => !!r.setlistEntry.radio_id)

  const placements = new Set(
    rows.map((r) => r.wtedPlacement).filter((p): p is string => !!p?.length),
  )
  const hasSinglePlacementType = placements.size <= 1
  const colSpan =
    7 + (showWtedColumn ? 1 : 0) + (showGroupColumn ? 1 : 0)

  let displayNum = 0

  const body: ReactNode[] = []

  rows.forEach((row, index) => {
    const prev = index > 0 ? rows[index - 1] : null
    const sl = row.setlistEntry

    if (!hasSinglePlacementType && row.wtedSet) {
      if (prev && row.wtedSet.startsWith("E")) {
        if (
          !prev.wtedSet ||
          !prev.wtedSet.startsWith("E") ||
          prev.wtedSet !== row.wtedSet
        ) {
          body.push(
            <TableRow
              key={`encore-${row.refId}-${index}`}
              className="border-border/60 hover:bg-transparent"
            >
              <TableCell
                colSpan={colSpan}
                className="border-y border-border bg-gray-700 px-0 py-[2px] text-center text-[0.625rem] font-medium text-foreground"
              >
                {getEncoreLabel(row.wtedSet)}
              </TableCell>
            </TableRow>,
          )
        }
      }

      if (
        prev?.wtedSet &&
        row.wtedSet &&
        shouldShowSetBreak(prev.wtedSet, row.wtedSet)
      ) {
        body.push(
          <TableRow
            key={`setbreak-${row.refId}-${index}`}
            className="border-border/60 hover:bg-transparent"
          >
            <TableCell
              colSpan={colSpan}
              className="border-y border-border bg-gray-800 px-0 py-[2px] text-center text-[0.625rem] font-medium text-foreground"
            >
              Set Break
            </TableCell>
          </TableRow>,
        )
      }
    }

    displayNum += 1
    const placementToken = getPlacementBarCssToken(row.wtedPlacement ?? null)
    const numberUsesPlacementColor = placementToken !== "none"
    const entryCategory =
      sl.song_category || sl.songs?.song_category || "undefined"
    const d = row.showDate?.trim()
    const yearPrefix = d && d.length >= 4 ? d.slice(0, 4) : ""
    const rowYear = /^\d{4}$/.test(yearPrefix) ? yearPrefix : null
    const yearMatches =
      !!hoveredPerformanceYear &&
      rowYear != null &&
      rowYear === hoveredPerformanceYear
    const rowGroupKey = wtedEpisodeShowGroupKey(row.showGroup)
    const groupMatches =
      !!hoveredShowGroupKey && rowGroupKey === hoveredShowGroupKey
    const categoryHighlight =
      !!hoveredCategory && entryCategory === hoveredCategory
    const shouldHighlightRow =
      categoryHighlight || yearMatches || groupMatches
    const categoryDim = !!hoveredCategory && !categoryHighlight
    const yearDim = !!hoveredPerformanceYear && !yearMatches
    const groupDim = !!hoveredShowGroupKey && !groupMatches
    const shouldDimRow = categoryDim || yearDim || groupDim

    body.push(
      <WtedEpisodeSetlistDataRow
        key={row.refId}
        row={row}
        displayNum={displayNum}
        placementToken={placementToken}
        numberUsesPlacementColor={numberUsesPlacementColor}
        shouldHighlightRow={shouldHighlightRow}
        shouldDimRow={shouldDimRow}
        router={router}
        isDesktop={isDesktop}
        showWtedColumn={showWtedColumn}
        showGroupColumn={showGroupColumn}
        onWtedClick={onWtedClick}
        onJotyClick={onJotyClick}
      />,
    )
  })

  return (
    <TooltipProvider delayDuration={0}>
      <div className="w-full overflow-x-auto">
        <Table className="display-setlist-table">
          <TableHeader>
            <WtedEpisodeSetlistTableHead
              showGroupColumn={showGroupColumn}
              showWtedColumn={showWtedColumn}
              isDesktop={isDesktop}
            />
          </TableHeader>
          <TableBody>{body}</TableBody>
        </Table>
      </div>
    </TooltipProvider>
  )
}
