"use client"

import { Fragment, useState } from "react"

import { SongDisplayName } from "@/components/dpro/song-display-name"
import {
  computeDisplayNumbers,
  getJotyPillWlV2Style,
  getLastCountBadgeStyle,
  shouldShowSetlistEntryShort,
} from "@/components/dpro/setlist/display-setlist-table.constants"
import { SetlistEntryGuestsCell } from "@/components/dpro/setlist/setlist-entry-guests-cell"
import { SetlistEntryLastCell } from "@/components/dpro/setlist/setlist-entry-last-cell"
import { SetlistEntryWtedCell } from "@/components/dpro/setlist/setlist-entry-wted-cell"
import {
  SetlistEntryStatsTooltipContent,
  entryHasSongStatsLines,
} from "@/components/dpro/setlist/setlist-entry-stats-tooltip-content"
import {
  SetlistTruncatableCell,
  SetlistTruncatableHtmlCell,
} from "@/components/dpro/setlist/setlist-truncatable-cell"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useIsDesktopContentLayout } from "@/hooks/use-mobile"
import {
  calculateRarity,
  formatEntryLength,
  getEncoreLabel,
  getPlacementColor,
  getRarityColor,
  getRarityPillBackground,
  shouldShowSetBreak,
} from "@/lib/setlist-utils"
import { cn } from "@/lib/utils"
import type { SetlistEntry, Show } from "@/types/setlist"

/** When `runSpan` is 1, use a compact rail label; two or more rows in the set use the full string. */
function railLabelForEntrySet(
  entrySet: string | null | undefined,
  runSpan: number,
): string {
  if (!entrySet) return ""
  const single = runSpan === 1
  if (entrySet.startsWith("E")) {
    if (!single) return getEncoreLabel(entrySet)
    const s = String(entrySet)
    if (s === "E1") return "Enc"
    if (s === "E2") return "E2"
    if (s === "E3") return "E3"
    return getEncoreLabel(entrySet) || s
  }
  if (single) return `S${entrySet}`
  return `Set ${entrySet}`
}

function WlHomeV2SetlistTableRow({
  entry,
  displayNumber,
  showCanonColumns,
  showWtedColumn,
  isDesktop,
  isFirstOfRun,
  runSpan,
  isRowHovered,
  onDataCellPointerEnter,
  onSetRailPointerEnter,
  onJotyBadgeClick,
}: {
  entry: SetlistEntry
  displayNumber: number | null
  showCanonColumns: boolean
  showWtedColumn: boolean
  isDesktop: boolean
  isFirstOfRun: boolean
  runSpan: number
  isRowHovered: boolean
  onDataCellPointerEnter: () => void
  onSetRailPointerEnter: () => void
  onJotyBadgeClick?: (entry: SetlistEntry) => void
}) {
  const [coachCollapsed, setCoachCollapsed] = useState(false)
  const [personnelTruncCollapsed, setPersonnelTruncCollapsed] = useState(false)

  const railClass = cn(
    "set-section-rail",
    entry.entry_set?.startsWith("E") && "set-section-rail--encore",
  )
  const barColor = getPlacementColor(entry.entry_placement)
  const rarity = calculateRarity(
    entry.times_played_num,
    entry.shows_since_debut_num,
  )
  const rarityPillBackground = getRarityPillBackground(rarity || null)
  const rarityPillBorderColor = getRarityColor(rarity || null)
  const lastBadgeStyle = getLastCountBadgeStyle(entry.last_count)
  const shortShown = shouldShowSetlistEntryShort(
    entry.entry_song,
    entry.entry_short,
  )
  const jotyPill = entry.joty_round
    ? getJotyPillWlV2Style(entry.joty_round)
    : null

  const showSongStatsTooltip = isDesktop && entryHasSongStatsLines(entry)
  const songCellInner = (
    <div className="song-cell-inner">
      <div className="song-cell-main">
        <SongDisplayName
          song={entry.entry_song}
          songDisplayName={entry.songs?.song_displayname}
        />
        {shortShown && entry.entry_short ?
          <span className="short">{entry.entry_short}</span>
        : null}
        {entry.entry_segue ?
          <span className="segue">
            → {entry.entry_segue.replace(/^>\s*/, "").trim()}
          </span>
        : null}
      </div>
      {jotyPill ?
        <div className="song-cell-joty">
          {onJotyBadgeClick ?
            <button
              type="button"
              className="joty-pill"
              style={{
                background: jotyPill.background,
                color: jotyPill.color,
                border: `1px solid ${jotyPill.borderColor}`,
              }}
              onClick={() => onJotyBadgeClick(entry)}
              aria-label={`Jam of the Year: ${entry.joty_round}`}
            >
              {entry.joty_round}
            </button>
          : <span
              className="joty-pill"
              style={{
                background: jotyPill.background,
                color: jotyPill.color,
                border: `1px solid ${jotyPill.borderColor}`,
              }}
            >
              {entry.joty_round}
            </span>
          }
        </div>
      : null}
    </div>
  )

  return (
    <tr
      className={cn("song-row", isRowHovered && "song-row--row-hover")}
    >
      {isFirstOfRun ?
        <td
          className={railClass}
          rowSpan={runSpan}
          onPointerEnter={onSetRailPointerEnter}
        >
          <span className="set-section-rail-text">
            {railLabelForEntrySet(entry.entry_set, runSpan)}
          </span>
        </td>
      : null}
      <td className="num-cell" onPointerEnter={onDataCellPointerEnter}>
        <span className="bar" style={{ background: barColor }} />
        {displayNumber ?? ""}
      </td>
      <td className="song-cell" onPointerEnter={onDataCellPointerEnter}>
        {showSongStatsTooltip ?
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex w-full min-w-0 cursor-default flex-col text-left">
                {songCellInner}
              </div>
            </TooltipTrigger>
            <TooltipContent
              className="max-w-[280px] leading-tight"
              side="top"
            >
              <SetlistEntryStatsTooltipContent entry={entry} />
            </TooltipContent>
          </Tooltip>
        : songCellInner}
      </td>
      {showWtedColumn ?
        <td className="center" onPointerEnter={onDataCellPointerEnter}>
          <SetlistEntryWtedCell entry={entry} showTooltips={isDesktop} />
        </td>
      : null}
      <td
        className="time-cell"
        onPointerEnter={onDataCellPointerEnter}
      >
        {formatEntryLength(entry.entry_length) ?? ""}
      </td>
      {showCanonColumns ?
        <td
          className="last-cell"
          onPointerEnter={onDataCellPointerEnter}
        >
          <SetlistEntryLastCell
            entry={entry}
            lastBadgeStyle={lastBadgeStyle}
            showTooltips={isDesktop}
            useWlHomeV2PillStyle
          />
        </td>
      : null}
      {showCanonColumns ?
        <td
          className="tour-cell"
          onPointerEnter={onDataCellPointerEnter}
        >
          {entry.song_tour_count ?? ""}
        </td>
      : null}
      {showCanonColumns ?
        <td
          className="rarity-cell"
          onPointerEnter={onDataCellPointerEnter}
        >
          {rarity ?
            <span
              className="rare-pill"
              style={{
                background: rarityPillBackground,
                border: `1px solid ${rarityPillBorderColor}`,
              }}
            >
              {rarity}
            </span>
          : null}
        </td>
      : null}
      <td
        className={cn(
          "personnel-cell",
          personnelTruncCollapsed ? "align-middle" : "align-top",
        )}
        onPointerEnter={onDataCellPointerEnter}
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
            />
          </SetlistTruncatableCell>
        : null}
      </td>
      <td
        className={cn("notes-cell", coachCollapsed ? "align-middle" : "align-top")}
        onPointerEnter={onDataCellPointerEnter}
      >
        {entry.entry_coachnotes?.trim() ?
          <SetlistTruncatableHtmlCell
            maxWidthClass="max-w-[400px]"
            measureWidthClass="w-max max-w-[400px]"
            measureKey={`${entry.entry_id}-coach`}
            html={entry.entry_coachnotes.trim()}
            expandLabel="Show full coach notes"
            htmlContentClassName="!text-[12px] !leading-[1.4]"
            blockPlainClassName="!text-[12px] !leading-[1.4]"
            onTruncatedCollapsedChange={setCoachCollapsed}
          />
        : null}
      </td>
    </tr>
  )
}

export function WlHomeV2SetlistTable({
  show,
  setlist,
  onJotyBadgeClick,
}: {
  show: Show
  setlist: SetlistEntry[]
  onJotyBadgeClick?: (entry: SetlistEntry) => void
}) {
  const [hoveredEntryId, setHoveredEntryId] = useState<string | null>(null)
  const isDesktop = useIsDesktopContentLayout()
  const showCanonColumns = show.show_canonid != null
  const showWtedColumn = setlist.some((e) => !!e.radio_id)
  const displayNumbers = computeDisplayNumbers(setlist)
  const uniquePlacements = new Set(setlist.map((e) => e.entry_placement))
  const hasSinglePlacementType = uniquePlacements.size === 1

  const fullColSpan =
    1 +
    1 +
    1 +
    (showWtedColumn ? 1 : 0) +
    1 +
    (showCanonColumns ? 3 : 0) +
    1 +
    1

  if (setlist.length === 0) {
    return (
      <div className="setlist-card">
        <p
          className="px-4 py-6 text-center text-[12px]"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          No setlist entries for this show.
        </p>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="setlist-card">
        <table
          className="set-table"
          onPointerLeave={() => setHoveredEntryId(null)}
        >
          <thead>
            <tr>
              <th
                className="set-section-rail-head"
                scope="col"
                aria-hidden={true}
              />
              <th className="center num-col">#</th>
              <th>Song</th>
              {showWtedColumn ?
                <th className="center">WTED</th>
              : null}
              <th className="center">Time</th>
              {showCanonColumns ?
                <th className="center">Last</th>
              : null}
              {showCanonColumns ?
                <th className="center">Tour</th>
              : null}
              {showCanonColumns ?
                <th className="center">Rarity</th>
              : null}
              <th>Personnel</th>
              <th>Coach&apos;s Notes</th>
            </tr>
          </thead>
          <tbody>
            {setlist.map((entry, index) => {
              const prevEntry = index > 0 ? setlist[index - 1]! : null
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
                    isDesktop={isDesktop}
                    isFirstOfRun={isFirstOfRun}
                    runSpan={runSpan}
                    isRowHovered={hoveredEntryId === entry.entry_id}
                    onDataCellPointerEnter={() =>
                      setHoveredEntryId(entry.entry_id)
                    }
                    onSetRailPointerEnter={() => setHoveredEntryId(null)}
                    onJotyBadgeClick={onJotyBadgeClick}
                  />
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  )
}
