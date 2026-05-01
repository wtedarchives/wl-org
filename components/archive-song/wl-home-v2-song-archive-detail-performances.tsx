"use client"

import Link from "next/link"
import { useCallback, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { SetlistEntryGuestsCell } from "@/components/dpro/setlist/setlist-entry-guests-cell"
import {
  jotyRoundDataAttr,
  shouldShowSetlistEntryShort,
} from "@/components/dpro/setlist/display-setlist-table.constants"
import { PerformanceTooltipContent } from "@/components/dpro/song/performance-tooltip"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import {
  SetlistTruncatableCell,
  SetlistTruncatableHtmlCell,
} from "@/components/dpro/setlist/setlist-truncatable-cell"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useIsDesktopContentLayout } from "@/hooks/use-mobile"
import { usePerformanceData } from "@/hooks/use-performance-data"
import { usePerformanceSorting } from "@/hooks/use-performance-sorting"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { formatSetlistDate } from "@/lib/setlist-utils"
import { formatPerformanceLength } from "@/lib/song-performance-utils"
import { getPlacementBarColor } from "@/lib/placement-bar-color"
import {
  getSongDetailPlacementChipClass,
  songDetailPlacementChipSurfaceStyle,
  songDetailPlacementLegendSwatch,
} from "@/lib/song-detail-placement-chip"
import { SETLIST_V2_ROW_TOOLTIP_CONTENT } from "@/components/wl-home-v2/wl-home-v2-setlist-table.constants"
import type { SongPerformance } from "@/types/song"
import { Columns, Rows } from "@phosphor-icons/react"

/** WL Home v2 song detail: `/archive/song?id=…&performances=table` (omit or `timeline` for timeline). */
const PERFORMANCES_VIEW_QUERY = "performances"

function performancesViewFromSearchParams(
  searchParams: URLSearchParams,
): "timeline" | "table" {
  const raw = searchParams.get(PERFORMANCES_VIEW_QUERY)?.trim().toLowerCase()
  return raw === "table" ? "table" : "timeline"
}

type TimelineSegment =
  | { kind: "year"; year: number }
  | { kind: "gap"; afterYear: number; beforeYear: number }

function buildTimelineSegments(sortedYears: number[]): TimelineSegment[] {
  const out: TimelineSegment[] = []
  for (let i = 0; i < sortedYears.length; i++) {
    const y = sortedYears[i]!
    out.push({ kind: "year", year: y })
    const next = sortedYears[i + 1]
    if (next !== undefined && next - y > 1) {
      out.push({ kind: "gap", afterYear: y, beforeYear: next })
    }
  }
  return out
}

function formatChipDate(showDate: string): string {
  const f = formatSetlistDate(showDate)
  return f.length >= 5 ? f.slice(0, 5) : f
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
}

function performanceNotes(p: SongPerformance): string {
  if (p.entry_segue?.trim()) return `→ ${stripTags(p.entry_segue)}`
  if (p.entry_coachnotes?.trim())
    return stripTags(p.entry_coachnotes).slice(0, 120) || "—"
  return "—"
}

function performanceVenueHref(p: SongPerformance): string | null {
  if (p.venue_id) return getVenueArchiveUrl(p.venue_id)
  if (p.show_subvenue_venue) return getVenueArchiveUrl(p.show_subvenue_venue)
  const venueSearchTerm = p.show_subvenue || p.show_venue_location
  if (venueSearchTerm) return getVenueArchiveUrl(venueSearchTerm)
  return null
}

/** Same predicate for timeline chips and table rows (group vs placement filters). */
function perfMatchesSongArchiveFilters(
  p: SongPerformance,
  selectedGroup: string | null,
  selectedPlacement: string | null,
): boolean {
  const groupOk = !selectedGroup || p.show_group === selectedGroup
  const placementOk =
    !selectedPlacement ||
    (p.entry_placement === selectedPlacement && p.show_canonid != null)
  return groupOk && placementOk
}

type SortColumnId =
  | "show_date"
  | "show_group"
  | "show_venue_location"
  | "entry_song"
  | "entry_set"
  | "gap"
  | "entry_length"

function PerfArchiveTableRow({
  perf,
  index,
  selectedGroup,
  songCanonical,
  songDisplayName,
  showTooltips,
  onJotyClick,
}: {
  perf: SongPerformance
  index: number
  selectedGroup: string | null
  songCanonical: string
  songDisplayName?: string | null
  showTooltips: boolean
  onJotyClick?: (year: number, entryId: string | null) => void
}) {
  const rowKey = perf.entry_id
    ? `${perf.entry_id}-${index}`
    : `${perf.show_id}-${index}`
  const shouldHighlight = Boolean(selectedGroup && perf.show_group === selectedGroup)
  const shouldMute = Boolean(selectedGroup && perf.show_group !== selectedGroup)
  const isMainSet = perf.entry_placement?.startsWith("Main Set ")
  const placementBar = isMainSet ? undefined : getPlacementBarColor(perf.entry_placement)
  const venueHref = performanceVenueHref(perf)
  const jotyRound = perf.joty_round?.trim()

  return (
    <tr
      className={
        shouldHighlight ? "perf-table-row--hl"
        : shouldMute ?
          "perf-table-row--muted"
        : ""
      }
    >
      <td
        className="date perf-table-td--show"
        style={{
          boxShadow: placementBar ? `inset -4px 0 0 ${placementBar}` : "none",
        }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={getSetlistArchiveUrl(perf.show_id)}>
              {formatSetlistDate(perf.show_date)}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="top">
            <PerformanceTooltipContent fullData={perf} />
          </TooltipContent>
        </Tooltip>
      </td>
      <td className="dim">{perf.show_group}</td>
      <td className="venue">
        {perf.show_subvenue ?
          <Tooltip>
            <TooltipTrigger asChild>
              {venueHref ?
                <Link href={venueHref}>{perf.show_venue_location}</Link>
              : <span>{perf.show_venue_location}</span>}
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[250px]">
              <div
                className="text-xs [&_a]:text-primary [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: perf.show_subvenue }}
              />
            </TooltipContent>
          </Tooltip>
        : venueHref ?
          <Link href={venueHref}>{perf.show_venue_location}</Link>
        : perf.show_venue_location}
      </td>
      <td className="perf-table-td--song">
        {perf.entry_song && perf.entry_song !== ">" ?
          <span className="perf-table-song-main">
            <span className="perf-table-song-title">
              <SongDisplayName
                song={songCanonical}
                songDisplayName={songDisplayName}
                underlineOnHover={false}
              />
            </span>
            {shouldShowSetlistEntryShort(
              perf.entry_song ?? songCanonical,
              perf.entry_short,
            ) && perf.entry_short ?
              <span className="short">{perf.entry_short}</span>
            : null}
            {perf.entry_segue ?
              <span className="perf-table-song-segue">→</span>
            : null}
          </span>
        : <Link
            href={getSetlistArchiveUrl(perf.show_id)}
            className="perf-table-song-tease"
          >
            &gt;
          </Link>
        }
      </td>
      <td className="dim perf-table-td--center">{perf.entry_set || ""}</td>
      <td className="perf-table-td--center perf-table-td--joty">
        {jotyRound ?
          <button
            type="button"
            className="joty-pill"
            data-joty-round={jotyRoundDataAttr(jotyRound)}
            onClick={() => {
              const year = new Date(perf.show_date).getFullYear()
              if (onJotyClick) onJotyClick(year, perf.entry_id ?? null)
              else window.location.href = "https://jotyoftheyear.com"
            }}
            aria-label={`Jam of the Year: ${jotyRound}`}
          >
            {jotyRound}
          </button>
        : null}
      </td>
      <td className="dim perf-table-td--center">
        {perf.gap !== null && perf.gap !== undefined ?
          perf.gap === "Debut" ?
            <span className="perf-table-gap-debut">Debut</span>
          : String(perf.gap)
        : ""}
      </td>
      <td className="dim perf-table-td--center">
        {perf.entry_length ? formatPerformanceLength(perf.entry_length) : ""}
      </td>
      <td className="perf-table-td--personnel">
        {perf.guests?.length ?
          <SetlistTruncatableCell
            maxWidthClass="max-w-[400px]"
            measureWidthClass="w-max max-w-[400px]"
            measureKey={`${rowKey}-guests`}
            expandLabel="Show all personnel"
          >
            <SetlistEntryGuestsCell
              entry={{ guests: perf.guests }}
              showTooltips={showTooltips}
              useWlHomeV2PillStyle
              tooltipContentClassName={
                SETLIST_V2_ROW_TOOLTIP_CONTENT.className
              }
            />
          </SetlistTruncatableCell>
        : null}
      </td>
      <td className="perf-table-td--coach">
        {perf.entry_coachnotes?.trim() ?
          <SetlistTruncatableHtmlCell
            maxWidthClass="max-w-[400px]"
            measureWidthClass="w-max max-w-[400px]"
            measureKey={`${rowKey}-coach`}
            html={perf.entry_coachnotes.trim()}
            expandLabel="Show full coach notes"
            htmlContentClassName="setlist-v2-notes-html"
            blockPlainClassName="setlist-v2-notes-plain"
          />
        : null}
      </td>
    </tr>
  )
}

export function WlHomeV2SongArchiveDetailPerformances({
  performances,
  songCanonical,
  songDisplayName,
  selectedGroup,
  selectedPlacement,
  onClearPerformanceFilter,
  onJotyBadgeClick,
}: {
  performances: SongPerformance[]
  songCanonical: string
  songDisplayName?: string | null
  selectedGroup: string | null
  selectedPlacement: string | null
  onClearPerformanceFilter: () => void
  onJotyBadgeClick?: (year: number, entryId: string | null) => void
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const performancesView = useMemo(
    () => performancesViewFromSearchParams(searchParams),
    [searchParams],
  )

  const setPerformancesView = useCallback(
    (mode: "timeline" | "table") => {
      const params = new URLSearchParams(searchParams.toString())
      if (mode === "timeline") params.delete(PERFORMANCES_VIEW_QUERY)
      else params.set(PERFORMANCES_VIEW_QUERY, "table")
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const { performancesWithGaps } = usePerformanceData(performances)
  const { sortColumn, sortDirection, handleSort, sortPerformances } =
    usePerformanceSorting()
  const showTooltips = useIsDesktopContentLayout()
  const [tooltip, setTooltip] = useState<{
    visible: boolean
    x: number
    y: number
    perf: SongPerformance | null
  }>({ visible: false, x: 0, y: 0, perf: null })

  const filteredPerformances = useMemo(
    () =>
      performancesWithGaps.filter((p) =>
        perfMatchesSongArchiveFilters(p, selectedGroup, selectedPlacement),
      ),
    [performancesWithGaps, selectedGroup, selectedPlacement],
  )

  const byYear = useMemo(() => {
    const map = new Map<number, SongPerformance[]>()
    filteredPerformances.forEach((p) => {
      const y = parseInt(p.show_date.slice(0, 4), 10)
      if (Number.isNaN(y)) return
      if (!map.has(y)) map.set(y, [])
      map.get(y)!.push(p)
    })
    for (const [, arr] of map) {
      arr.sort((a, b) => {
        const d = a.show_date.localeCompare(b.show_date)
        if (d !== 0) return d
        const s = (a.entry_set || "").localeCompare(b.entry_set || "")
        if (s !== 0) return s
        return (
          (parseInt(String(a.entry_setnum), 10) || 0) -
          (parseInt(String(b.entry_setnum), 10) || 0)
        )
      })
    }
    return map
  }, [filteredPerformances])

  const timelineYears = useMemo(
    () => [...byYear.keys()].sort((a, b) => a - b),
    [byYear],
  )

  const timelineSegments = useMemo(
    () => buildTimelineSegments(timelineYears),
    [timelineYears],
  )

  const sortedTableRows = useMemo(() => {
    return sortPerformances(filteredPerformances)
  }, [filteredPerformances, sortColumn, sortDirection, sortPerformances])

  const onSortColumn = useCallback(
    (column: SortColumnId) => () => handleSort(column),
    [handleSort],
  )

  const showTooltip = useCallback((e: React.MouseEvent, perf: SongPerformance) => {
    setTooltip({
      visible: true,
      x: e.clientX + 14,
      y: e.clientY + 14,
      perf,
    })
  }, [])

  const moveTooltip = useCallback((e: React.MouseEvent) => {
    setTooltip((t) =>
      t.visible ? { ...t, x: e.clientX + 14, y: e.clientY + 14 } : t,
    )
  }, [])

  const hideTooltip = useCallback(() => {
    setTooltip((t) => ({ ...t, visible: false, perf: null }))
  }, [])

  if (performances.length === 0) {
    return (
      <div className="card perf-card">
        <div className="card-head perf-card-head-pad">
          <h3>Performances</h3>
        </div>
        <div className="card-body">
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", margin: 0 }}>
            This song hasn&apos;t been played live.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="card perf-card">
        <div className="card-head perf-card-head-pad">
          <h3>Performances</h3>
          <div className="perf-head-controls">
            {selectedGroup || selectedPlacement ?
              <span className="pill-filter">
                <span>{selectedGroup ?? selectedPlacement}</span>
                <span
                  className="x"
                  role="button"
                  tabIndex={0}
                  onClick={onClearPerformanceFilter}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      onClearPerformanceFilter()
                    }
                  }}
                >
                  ×
                </span>
              </span>
            : null}
            <div className="view-toggle">
              <button
                type="button"
                className={performancesView === "timeline" ? "active" : ""}
                title="Timeline view"
                aria-label="Timeline"
                onClick={() => setPerformancesView("timeline")}
              >
                <Columns
                  size={14}
                  weight="fill"
                  aria-hidden
                  className="perf-view-toggle-icon"
                />
              </button>
              <button
                type="button"
                className={performancesView === "table" ? "active" : ""}
                title="Table view"
                aria-label="Table"
                onClick={() => setPerformancesView("table")}
              >
                <Rows
                  size={14}
                  weight="fill"
                  aria-hidden
                  className="perf-view-toggle-icon"
                />
              </button>
            </div>
          </div>
        </div>

        <div
          className="timeline-wrap"
          hidden={performancesView !== "timeline"}
          style={{ opacity: performancesView === "timeline" ? 1 : 0 }}
        >
          <div className="timeline">
            {timelineSegments.map((seg) =>
              seg.kind === "gap" ?
                <div
                  key={`gap-${seg.afterYear}-${seg.beforeYear}`}
                  className="tl-year tl-year--gap"
                  aria-label={`Gap in timeline between ${seg.afterYear} and ${seg.beforeYear}`}
                  title={`Years ${seg.afterYear + 1}–${seg.beforeYear - 1}`}
                >
                  <div className="tl-year-gap-arrow">→</div>
                  <div className="tl-list" />
                </div>
              : <div key={seg.year} className="tl-year">
                  <div className="tl-year-label">{seg.year}</div>
                  <div className="tl-list">
                    {(byYear.get(seg.year) ?? []).map((p, idx) => {
                      const chipClass = getSongDetailPlacementChipClass(
                        p.entry_placement,
                      )
                      return (
                        <Link
                          key={`${p.entry_id ?? p.show_id}-${idx}`}
                          href={getSetlistArchiveUrl(p.show_id)}
                          className={`tl-chip ${chipClass}`}
                          style={songDetailPlacementChipSurfaceStyle(
                            p.entry_placement,
                            chipClass,
                          )}
                          onMouseEnter={(e) => showTooltip(e, p)}
                          onMouseMove={moveTooltip}
                          onMouseLeave={hideTooltip}
                        >
                          {formatChipDate(p.show_date)}
                        </Link>
                      )
                    })}
                  </div>
                </div>
            )}
          </div>
        </div>

        <div
          className="perf-table-wrap"
          hidden={performancesView !== "table"}
          style={{ opacity: performancesView === "table" ? 1 : 0 }}
        >
          <table className="perf-table">
            <thead>
              <tr>
                <th
                  className={
                    sortColumn === "show_date" ? "active perf-table-th--center" : "perf-table-th--center"
                  }
                  onClick={onSortColumn("show_date")}
                >
                  Show
                </th>
                <th
                  className={sortColumn === "show_group" ? "active" : ""}
                  onClick={onSortColumn("show_group")}
                >
                  Group
                </th>
                <th
                  className={
                    sortColumn === "show_venue_location" ? "active" : ""
                  }
                  onClick={onSortColumn("show_venue_location")}
                >
                  Location
                </th>
                <th
                  className={sortColumn === "entry_song" ? "active" : ""}
                  onClick={onSortColumn("entry_song")}
                >
                  Song
                </th>
                <th
                  className={
                    sortColumn === "entry_set" ?
                      "active perf-table-th--center"
                    : "perf-table-th--center"
                  }
                  onClick={onSortColumn("entry_set")}
                >
                  Set
                </th>
                <th className="perf-table-th--static perf-table-th--center">
                  JOTY
                </th>
                <th
                  className={
                    sortColumn === "gap" ?
                      "active perf-table-th--center"
                    : "perf-table-th--center"
                  }
                  onClick={onSortColumn("gap")}
                >
                  Gap
                </th>
                <th
                  className={
                    sortColumn === "entry_length" ?
                      "active perf-table-th--center"
                    : "perf-table-th--center"
                  }
                  onClick={onSortColumn("entry_length")}
                >
                  Length
                </th>
                <th className="perf-table-th--static perf-table-th--personnel">
                  Personnel
                </th>
                <th className="perf-table-th--static perf-table-th--coach">
                  Coach&apos;s Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedTableRows.map((p, index) => (
                <PerfArchiveTableRow
                  key={
                    p.entry_id ?
                      `${p.entry_id}-${index}`
                    : `${p.show_id}-${index}`
                  }
                  perf={p}
                  index={index}
                  selectedGroup={selectedGroup}
                  songCanonical={songCanonical}
                  songDisplayName={songDisplayName}
                  showTooltips={showTooltips}
                  onJotyClick={onJotyBadgeClick}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div
        className={`song-archive-detail-tooltip${tooltip.visible ? " visible" : ""}`}
        role="tooltip"
        style={{
          left: tooltip.x,
          top: tooltip.y,
        }}
      >
        {tooltip.perf ?
          <>
            <div className="tt-date">
              {formatSetlistDate(tooltip.perf.show_date)}
            </div>
            <div className="tt-venue">{tooltip.perf.show_subvenue}</div>
            <div className="tt-row">{tooltip.perf.show_venue_location}</div>
            <div className="tt-row">
              {tooltip.perf.entry_placement} · {tooltip.perf.show_group}
            </div>
            {performanceNotes(tooltip.perf) !== "—" ?
              <div className="tt-row">{performanceNotes(tooltip.perf)}</div>
            : null}
          </>
        : null}
      </div>
    </>
  )
}

export function placementStatsForVerbatimBar(
  placementStats: Array<{
    placement: string
    count: number
    percentage: number
    order?: number
  }>,
): Array<{ placement: string; count: number; pct: number; flex: number }> {
  const sorted = [...placementStats].sort((a, b) => {
    if (a.order != null && b.order != null) return a.order - b.order
    if (a.order != null) return -1
    if (b.order != null) return 1
    return b.count - a.count
  })
  const total = sorted.reduce((s, x) => s + x.count, 0) || 1
  return sorted.map((s) => ({
    placement: s.placement,
    count: s.count,
    pct: s.percentage,
    flex: Math.max(1, Math.round((s.count / total) * 100)),
  }))
}

export function placementLegendRows(
  placementStats: Array<{
    placement: string
    count: number
    percentage: number
    order?: number
  }>,
) {
  const sorted = [...placementStats].sort((a, b) => {
    if (a.order != null && b.order != null) return a.order - b.order
    if (a.order != null) return -1
    if (b.order != null) return 1
    return b.count - a.count
  })
  return sorted.map((s) => ({
    placement: s.placement,
    count: s.count,
    pct: s.percentage,
    swatch: songDetailPlacementLegendSwatch(s.placement),
  }))
}
