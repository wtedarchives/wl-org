"use client"

import Link from "next/link"

import { PerformanceTooltipContent } from "@/components/dpro/song/performance-tooltip"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { getSongDetailPlacementChipClass, songDetailPlacementChipSurfaceStyle } from "@/lib/song-detail-placement-chip"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import type { SongPerformance } from "@/types/song"
import type { ReactNode } from "react"
import { Columns, Rows } from "@phosphor-icons/react"

import {
  formatChipDate,
  type TimelineSegment,
} from "@/components/archive-song/song-archive-detail-performances-lib"
import type { SongArchivePerformanceWtedPayload } from "@/components/archive-song/song-archive-detail-performances-types"
import { PerfArchiveTableRow } from "@/components/archive-song/wl-home-v2-song-archive-detail-perf-table-row"
import {
  SETLIST_HEADER_TOOLTIP_CONTENT,
  SETLIST_V2_ROW_TOOLTIP_CONTENT,
} from "@/components/wl-home-v2/wl-home-v2-setlist-table.constants"

export type PerfSortColumnId =
  | "show_date"
  | "show_group"
  | "show_venue_location"
  | "entry_song"
  | "entry_set"
  | "gap"
  | "entry_length"

export function SongArchiveDetailPerfEmpty() {
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

export function SongArchiveDetailPerfCardShell({
  selectedGroup,
  selectedPlacement,
  onClearPerformanceFilter,
  performancesView,
  setPerformancesView,
  children,
  headFilters,
}: {
  selectedGroup: string | null
  selectedPlacement: string | null
  onClearPerformanceFilter: () => void
  performancesView: "timeline" | "table"
  setPerformancesView: (mode: "timeline" | "table") => void
  children: ReactNode
  /** When set, replaces the default group/placement pill (e.g. personnel: group + song pills). */
  headFilters?: ReactNode
}) {
  return (
    <div className="card perf-card">
      <div className="card-head perf-card-head-pad">
        <h3>Performances</h3>
        <div className="perf-head-controls">
          {headFilters !== undefined ?
            headFilters
          : selectedGroup || selectedPlacement ?
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
      {children}
    </div>
  )
}

export function SongArchiveDetailPerfTimeline({
  performancesView,
  timelineSegments,
  byYear,
  showTooltips,
}: {
  performancesView: "timeline" | "table"
  timelineSegments: TimelineSegment[]
  byYear: Map<number, SongPerformance[]>
  showTooltips: boolean
}) {
  return (
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
                  const chip = (
                    <Link
                      href={getSetlistArchiveUrl(p.show_id)}
                      className={`tl-chip ${chipClass}`}
                      style={songDetailPlacementChipSurfaceStyle(
                        p.entry_placement,
                        chipClass,
                      )}
                    >
                      {formatChipDate(p.show_date)}
                    </Link>
                  )
                  return (
                    <span
                      key={`${p.entry_id ?? p.show_id}-${idx}`}
                      className="contents"
                    >
                      {showTooltips ?
                        <Tooltip>
                          <TooltipTrigger asChild>{chip}</TooltipTrigger>
                          <TooltipContent
                            {...SETLIST_V2_ROW_TOOLTIP_CONTENT}
                          >
                            <PerformanceTooltipContent fullData={p} />
                          </TooltipContent>
                        </Tooltip>
                      : chip}
                    </span>
                  )
                })}
              </div>
            </div>,
        )}
      </div>
    </div>
  )
}

export function SongArchiveDetailPerfTable({
  performancesView,
  showWtedColumn,
  showTooltips,
  sortColumn,
  onSortColumn,
  sortedTableRows,
  selectedGroup,
  songCanonical,
  songDisplayName,
  onJotyBadgeClick,
  onWtedPayloadClick,
}: {
  performancesView: "timeline" | "table"
  showWtedColumn: boolean
  showTooltips: boolean
  sortColumn: string | null
  onSortColumn: (column: PerfSortColumnId) => () => void
  sortedTableRows: SongPerformance[]
  selectedGroup: string | null
  songCanonical: string
  songDisplayName?: string | null
  onJotyBadgeClick?: (year: number, entryId: string | null) => void
  onWtedPayloadClick?: (payload: SongArchivePerformanceWtedPayload) => void
}) {
  return (
    <div
      className="perf-table-wrap"
      hidden={performancesView !== "table"}
      style={{ opacity: performancesView === "table" ? 1 : 0 }}
    >
      <table
        className="perf-table"
        {...(showWtedColumn ? { "data-has-wted-col": "" } : {})}
      >
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
            {showWtedColumn ?
              <th className="perf-table-th--static perf-table-th--center">
                {showTooltips ?
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="setlist-th-help">WTED</span>
                    </TooltipTrigger>
                    <TooltipContent
                      className="setlist-header-tooltip setlist-header-tooltip--tight"
                      {...SETLIST_HEADER_TOOLTIP_CONTENT}
                    >
                      Use the icons below to request songs on WTED Goose
                      Radio.
                    </TooltipContent>
                  </Tooltip>
                : "WTED"}
              </th>
            : null}
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
              showWtedColumn={showWtedColumn}
              onWtedPayloadClick={onWtedPayloadClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
