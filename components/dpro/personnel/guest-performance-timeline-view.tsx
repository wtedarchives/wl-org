"use client"

import { useMemo } from "react"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PERFORMANCE_YEARS } from "@/lib/song-performance-utils"
import { formatSetlistDate } from "@/lib/setlist-utils"
import type { GuestShow } from "@/hooks/use-guest-data"
import {
  buildTimelineSegments,
  formatChipDate,
} from "@/components/archive-song/song-archive-detail-performances-lib"
import { useIsDesktopContentLayout } from "@/hooks/use-mobile"
import { SETLIST_V2_ROW_TOOLTIP_CONTENT } from "@/components/wl-home-v2/wl-home-v2-setlist-table.constants"

interface GuestTimelinePerf {
  formattedDate: string
  show_id: string
  fullData: GuestShow
}

interface GuestPerformanceTimelineViewProps {
  performancesByYear: Record<number, GuestTimelinePerf[]>
  selectedGroup: string | null
  /** WL Home personnel: match `/archive/song` timeline (segments, gaps, verbatim chrome). */
  wlHomeV2?: boolean
}

function shouldHighlightGuest(perf: GuestShow, selectedGroup: string | null) {
  if (selectedGroup && perf.show_group !== selectedGroup) return false
  return true
}

function GuestWlHomeV2Timeline({
  performancesByYear,
  selectedGroup,
}: {
  performancesByYear: Record<number, GuestTimelinePerf[]>
  selectedGroup: string | null
}) {
  const showTooltips = useIsDesktopContentLayout()

  const sortedYears = useMemo(() => {
    return Object.entries(performancesByYear)
      .filter(([, perfs]) => perfs && perfs.length > 0)
      .map(([y]) => Number(y))
      .sort((a, b) => a - b)
  }, [performancesByYear])

  const timelineSegments = useMemo(
    () => buildTimelineSegments(sortedYears),
    [sortedYears],
  )

  if (sortedYears.length === 0) {
    return (
      <div className="timeline-wrap">
        <p
          className="m-0 text-center"
          style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}
        >
          No performances match the current filter.
        </p>
      </div>
    )
  }

  return (
    <div className="timeline-wrap">
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
                {(performancesByYear[seg.year] ?? [])
                  .slice()
                  .sort((a, b) => {
                    const d = a.fullData.show_date.localeCompare(
                      b.fullData.show_date,
                    )
                    if (d !== 0) return d
                    return a.formattedDate.localeCompare(b.formattedDate)
                  })
                  .map((perf, idx) => {
                    const highlighted = shouldHighlightGuest(
                      perf.fullData,
                      selectedGroup,
                    )
                    const chip = (
                      <Link
                        href={getSetlistArchiveUrl(perf.show_id)}
                        className={`tl-chip mainset${
                          selectedGroup && !highlighted ? " opacity-30" : ""
                        }`}
                      >
                        {formatChipDate(perf.fullData.show_date)}
                      </Link>
                    )
                    return (
                      <span
                        key={`${seg.year}-${perf.show_id}-${idx}`}
                        className="contents"
                      >
                        {showTooltips ?
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>{chip}</TooltipTrigger>
                            <TooltipContent {...SETLIST_V2_ROW_TOOLTIP_CONTENT}>
                              <div className="wl-home-v2-setlist-song-spread-tooltip-inner text-left text-xs">
                                <p className="wl-home-v2-setlist-song-spread-tooltip-title">
                                  {formatSetlistDate(perf.fullData.show_date)}
                                </p>
                                <p className="leading-snug">
                                  {perf.fullData.show_group}
                                </p>
                                <p className="text-white/70">
                                  {perf.fullData.show_venue_location}
                                </p>
                              </div>
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

export function GuestPerformanceTimelineView({
  performancesByYear,
  selectedGroup,
  wlHomeV2 = false,
}: GuestPerformanceTimelineViewProps) {
  if (wlHomeV2) {
    return (
      <GuestWlHomeV2Timeline
        performancesByYear={performancesByYear}
        selectedGroup={selectedGroup}
      />
    )
  }

  const shouldHighlight = (perf: GuestShow) => {
    if (selectedGroup && perf.show_group !== selectedGroup) return false
    return true
  }

  return (
    <div className="p-2">
      <div className="overflow-x-auto flex justify-start">
        <div className="flex flex-row min-w-max">
          {PERFORMANCE_YEARS.map((year, index) => (
            <div
              key={year}
              className={`w-14 px-1 ${
                index !== PERFORMANCE_YEARS.length - 1
                  ? "border-r border-border"
                  : ""
              }`}
            >
              <div className="text-muted-foreground text-xs font-medium mb-1 text-center bg-muted/60 rounded py-0.5">
                {year}
              </div>
              <div className="space-y-px">
                {performancesByYear[year]
                  ?.slice()
                  .sort((a, b) => a.formattedDate.localeCompare(b.formattedDate))
                  .map((perf, idx) => {
                    const isHighlighted = shouldHighlight(perf.fullData)
                    return (
                      <Tooltip key={`${year}-${perf.show_id}-${idx}`}>
                        <TooltipTrigger asChild>
                          <Link
                            href={getSetlistArchiveUrl(perf.show_id)}
                            className={`block w-full text-[0.625rem] text-center px-0.5 font-medium rounded transition-colors hover:underline text-foreground ${
                              selectedGroup && !isHighlighted
                                ? "opacity-30"
                                : "opacity-100"
                            }`}
                          >
                            {perf.formattedDate}
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <div className="text-xs space-y-0.5">
                            <p className="font-medium">
                              {formatSetlistDate(perf.fullData.show_date)}
                            </p>
                            <p>{perf.fullData.show_group}</p>
                            <p className="text-muted-foreground">
                              {perf.fullData.show_venue_location}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
