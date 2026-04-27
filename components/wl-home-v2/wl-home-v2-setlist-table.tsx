"use client"

import { Fragment, useMemo, useState } from "react"

import { SongDisplayName } from "@/components/dpro/song-display-name"
import {
  computeDisplayNumbers,
  getJotyPillWlV2Style,
  getLastCountBadgeStyle,
  getLastCountPillStyle,
  JOTY_EXPLANATIONS,
  JOTY_ROUND_ORDER,
  SHORT_EXPLANATIONS,
  shouldShowSetlistEntryShort,
} from "@/components/dpro/setlist/display-setlist-table.constants"
import { SetlistEntryGuestsCell } from "@/components/dpro/setlist/setlist-entry-guests-cell"
import { SetlistEntryLastCell } from "@/components/dpro/setlist/setlist-entry-last-cell"
import { SetlistEntryNumberCell } from "@/components/dpro/setlist/setlist-entry-number-cell"
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
import type { ReleaseToEntriesMap } from "@/hooks/use-setlist-releases"
import type { SetlistEntry, Show } from "@/types/setlist"

/**
 * Vertical rail label for `entry_set`. Main sets: `S{n}` / `Set n`. Encores:
 * - 1 song: `E1` / `E2` / `E3`
 * - 2 songs: `Encore` / `Encore 2` / `Encore 3`
 * - 3+ songs: `Encore` / `2nd Encore` / `3rd Encore` (`getEncoreLabel`)
 */
function railLabelForEntrySet(
  entrySet: string | null | undefined,
  runSpan: number,
): string {
  if (!entrySet) return ""
  const single = runSpan === 1
  if (entrySet.startsWith("E")) {
    const s = String(entrySet)
    if (runSpan === 1) {
      if (s === "E1") return "E1"
      if (s === "E2") return "E2"
      if (s === "E3") return "E3"
      return getEncoreLabel(entrySet) || s
    }
    if (runSpan === 2) {
      if (s === "E1") return "Encore"
      if (s === "E2") return "Encore 2"
      if (s === "E3") return "Encore 3"
      return getEncoreLabel(entrySet) || s
    }
    return getEncoreLabel(entrySet) || s
  }
  if (single) return `S${entrySet}`
  return `Set ${entrySet}`
}

/** Last column header: same pill shapes as `last-pill` + copy (portaled tooltip). */
function WlHomeV2LastHeaderTooltipBody() {
  const rows = [
    {
      sample: "Debut",
      rest: "First known time the song was played by Goose.",
    },
    {
      sample: "TD",
      rest: "First time played in the current tour.",
    },
    {
      sample: "LIB",
      rest: "First time in more than a calendar year.",
    },
  ] as const
  return (
    <div className="setlist-header-last-tooltip">
      {rows.map(({ sample, rest }) => {
        const pill = getLastCountPillStyle(sample)
        if (!pill) return null
        return (
          <div key={sample} className="setlist-header-last-tooltip-row">
            <span
              className="setlist-legend-last-pill"
              style={{
                background: pill.background,
                color: pill.color,
                border: `1px solid ${pill.borderColor}`,
              }}
            >
              {sample}
            </span>
            <span className="setlist-header-last-tooltip-rest">{rest}</span>
          </div>
        )
      })}
    </div>
  )
}

/** Song column header explainer (segue, [short] keys, JOTY round legend) — WL v2 treatment. */
function WlHomeV2SetlistSongHeaderTooltipBody({
  hasSegue,
  sortedShorts,
  jotyRoundsInOrder,
  shortLabelByKey,
}: {
  hasSegue: boolean
  sortedShorts: string[]
  jotyRoundsInOrder: string[]
  shortLabelByKey: Map<string, string>
}) {
  return (
    <div className="setlist-header-song-tooltip">
      {hasSegue ?
        <div className="setlist-header-song-tooltip-row setlist-header-song-tooltip-row--segue">
          <span className="setlist-header-song-tooltip-arrow" aria-hidden>
            →
          </span>
          <span className="setlist-header-song-tooltip-segue-text">
            Song segues into the next song without stopping.
          </span>
        </div>
      : null}
      {sortedShorts.map((short) => (
        <div key={short} className="setlist-header-song-tooltip-row setlist-header-song-tooltip-row--short">
          <span className="setlist-legend-short-pill">
            {shortLabelByKey.get(short) ?? short}
          </span>
          <span className="setlist-header-song-tooltip-desc">
            {SHORT_EXPLANATIONS[short]}
          </span>
        </div>
      ))}
      {jotyRoundsInOrder.map((round) => {
        const pill = getJotyPillWlV2Style(round)
        return (
          <div key={round} className="setlist-header-song-tooltip-row setlist-header-song-tooltip-row--joty">
            <span
              className="setlist-header-song-tooltip-joty-pill"
              style={{
                background: pill.background,
                color: pill.color,
                border: `1px solid ${pill.borderColor}`,
              }}
            >
              {round}
            </span>
            <span className="setlist-header-song-tooltip-desc">
              {JOTY_EXPLANATIONS[round] ?? round}
            </span>
          </div>
        )
      })}
    </div>
  )
}

const SETLIST_HEADER_TOOLTIP_CONTENT = {
  side: "bottom" as const,
  sideOffset: 6,
}

/** Portaled row tooltips (Song stats, WTED, Last, personnel): same panel as `setlist-header-tooltip`. */
const SETLIST_V2_ROW_TOOLTIP_CONTENT = {
  className: "setlist-header-tooltip",
  side: "top" as const,
  sideOffset: 6,
} as const

/** Show-level coach notes + callbacks under the setlist table (hidden when both empty). */
function WlHomeV2SetlistCoachCallbacksFooter({
  coachNotesHtml,
  callbacksHtml,
}: {
  coachNotesHtml: string
  callbacksHtml: string
}) {
  const hasCoach = coachNotesHtml.length > 0
  const hasCallbacks = callbacksHtml.length > 0
  if (!hasCoach && !hasCallbacks) return null

  const split = hasCoach && hasCallbacks

  const col = (label: string, html: string) => (
    <div className="setlist-card-notes-col">
      <div className="show-notes setlist-card-notes-col-inner">
        <div className="show-notes-inner">
          <div className="notes-label">{label}</div>
          <div
            className="show-notes-body"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div className="setlist-card-after-table-divider" aria-hidden />
      <div
        className={cn(
          "setlist-card-notes-row",
          split && "setlist-card-notes-row--split",
        )}
      >
        {hasCoach ? col("Coach's Notes", coachNotesHtml) : null}
        {split ?
          <div className="setlist-card-notes-col-sep" aria-hidden />
        : null}
        {hasCallbacks ? col("Callbacks", callbacksHtml) : null}
      </div>
    </>
  )
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
  onSongClick,
  onWtedClick,
  showTimeColumn,
  showCoachColumn,
  showAdminUi,
  copiedEntryIds,
  onNumberClick,
  hoveredReleaseId,
  releaseToEntriesMap,
  hoveredCategory,
  showDiscographySetUi,
}: {
  entry: SetlistEntry
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
  onJotyBadgeClick?: (entry: SetlistEntry) => void
  onSongClick?: (entry: SetlistEntry) => void
  onWtedClick?: (entry: SetlistEntry) => void
  showAdminUi?: boolean
  copiedEntryIds?: Set<string>
  onNumberClick?: (entryId: string) => void
  hoveredReleaseId?: string | null
  releaseToEntriesMap?: ReleaseToEntriesMap
  hoveredCategory?: string | null
  /** Set rail, set-break rows, and # placement bar — off when `show.discography_display === false`. */
  showDiscographySetUi: boolean
}) {
  const [coachCollapsed, setCoachCollapsed] = useState(false)
  const [personnelTruncCollapsed, setPersonnelTruncCollapsed] = useState(false)

  const railClass = cn(
    "set-section-rail",
    entry.entry_set?.startsWith("E") && "set-section-rail--encore",
  )
  const barColor = getPlacementColor(entry.entry_placement)
  const isCopied = copiedEntryIds?.has(entry.entry_id) ?? false
  const canCopyNumber = !!(showAdminUi && onNumberClick)
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

  const entryIdsForRelease = hoveredReleaseId
    ? releaseToEntriesMap?.[hoveredReleaseId]
    : undefined
  const isEntryOnHoveredRelease = !!entryIdsForRelease?.has(entry.entry_id)
  const shouldReleaseHighlight =
    !!hoveredReleaseId && isEntryOnHoveredRelease
  const shouldReleaseDim =
    !!hoveredReleaseId && !isEntryOnHoveredRelease

  const entryCategory =
    entry.song_category || entry.songs?.song_category || "undefined"
  const shouldCategoryHighlight =
    !hoveredReleaseId &&
    !!hoveredCategory &&
    entryCategory === hoveredCategory
  const shouldCategoryDim =
    !hoveredReleaseId &&
    !!hoveredCategory &&
    entryCategory !== hoveredCategory

  const shouldRowHighlight = shouldReleaseHighlight || shouldCategoryHighlight
  const shouldRowDim = shouldReleaseDim || shouldCategoryDim

  const showSongStatsTooltip = isDesktop && entryHasSongStatsLines(entry)
  const songCellInner = (
    <div className="song-cell-inner">
      <div className="song-cell-main">
        {onSongClick ?
          <button
            type="button"
            className="song-cell-song-hit"
            onClick={() => onSongClick(entry)}
          >
            <SongDisplayName
              song={entry.entry_song}
              songDisplayName={entry.songs?.song_displayname}
            />
          </button>
        : <SongDisplayName
            song={entry.entry_song}
            songDisplayName={entry.songs?.song_displayname}
          />
        }
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
      className={cn(
        "song-row",
        isRowHovered && "song-row--row-hover",
        shouldRowHighlight && "song-row--release-highlight",
        shouldRowDim && "song-row--release-dim",
      )}
    >
      {showDiscographySetUi && isFirstOfRun ?
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
      <td
        className={cn(
          "num-cell",
          isCopied && "num-cell--copied",
          !showDiscographySetUi && "num-cell--no-placement-bar",
        )}
        onPointerEnter={onDataCellPointerEnter}
      >
        {showDiscographySetUi ?
          <span className="bar" style={{ background: barColor }} />
        : null}
        <SetlistEntryNumberCell
          entry={entry}
          displayNumber={displayNumber}
          isCopied={isCopied}
          canCopyNumber={canCopyNumber}
          onNumberClick={onNumberClick}
        />
      </td>
      <td className="song-cell" onPointerEnter={onDataCellPointerEnter}>
        {showSongStatsTooltip ?
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex w-full min-w-0 cursor-default flex-col text-left">
                {songCellInner}
              </div>
            </TooltipTrigger>
            <TooltipContent {...SETLIST_V2_ROW_TOOLTIP_CONTENT}>
              <SetlistEntryStatsTooltipContent entry={entry} />
            </TooltipContent>
          </Tooltip>
        : songCellInner}
      </td>
      {showWtedColumn ?
        <td className="center" onPointerEnter={onDataCellPointerEnter}>
          <SetlistEntryWtedCell
            entry={entry}
            onWtedClick={onWtedClick}
            showTooltips={isDesktop}
            tooltipContentClassName={SETLIST_V2_ROW_TOOLTIP_CONTENT.className}
          />
        </td>
      : null}
      {showTimeColumn ?
        <td
          className="time-cell"
          onPointerEnter={onDataCellPointerEnter}
        >
          {formatEntryLength(entry.entry_length) ?? ""}
        </td>
      : null}
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
            tooltipContentClassName={SETLIST_V2_ROW_TOOLTIP_CONTENT.className}
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
              tooltipContentClassName={SETLIST_V2_ROW_TOOLTIP_CONTENT.className}
            />
          </SetlistTruncatableCell>
        : null}
      </td>
      {showCoachColumn ?
        <td
          className={cn(
            "notes-cell",
            coachCollapsed ? "align-middle" : "align-top",
          )}
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
      : null}
    </tr>
  )
}

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
    return (
      <div className="setlist-card">
        <p
          className="px-4 py-6 text-center text-[12px]"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          No setlist entries for this show.
        </p>
        <WlHomeV2SetlistCoachCallbacksFooter
          coachNotesHtml={coachNotesShowText}
          callbacksHtml={callbacksText}
        />
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
                <th>Coach&apos;s Notes</th>
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
        <WlHomeV2SetlistCoachCallbacksFooter
          coachNotesHtml={coachNotesShowText}
          callbacksHtml={callbacksText}
        />
      </div>
    </TooltipProvider>
  )
}
