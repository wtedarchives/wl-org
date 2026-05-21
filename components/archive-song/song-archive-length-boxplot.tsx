"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"

import { PerformanceTooltipContent } from "@/components/dpro/song/performance-tooltip"
import { formatDuration } from "@/components/dpro/tours/tour-song-stats-duration"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SETLIST_V2_ROW_TOOLTIP_CONTENT } from "@/components/wl-home-v2/wl-home-v2-setlist-table.constants"
import { useIsDesktopContentLayout } from "@/hooks/use-mobile"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { formatSetlistDate } from "@/lib/setlist-utils"
import {
  buildSongShowLengthPoints,
  SONG_LENGTH_BOXPLOT_MIN_SHOWS,
  summarizeSongShowLengths,
  type SongShowLengthPoint,
} from "@/lib/song-performance-length-boxplot"
import type { SongPerformance } from "@/types/song"

import "./song-archive-length-boxplot.css"

const CHART_H = 56
const PAD_X_MIN = 12

function padXForWidth(chartW: number): number {
  return Math.max(PAD_X_MIN, Math.round(chartW * 0.03))
}

function xPercent(
  value: number,
  min: number,
  max: number,
  padX: number,
  chartW: number,
): number {
  const innerW = Math.max(0, chartW - padX * 2)
  if (max <= min || chartW <= 0) return 50
  const x = padX + ((value - min) / (max - min)) * innerW
  return (x / chartW) * 100
}

/** Slight vertical offset when multiple shows share the same length. */
function yOffsetForPoint(
  point: SongShowLengthPoint,
  points: SongShowLengthPoint[],
): number {
  const same = points.filter((p) => p.seconds === point.seconds)
  if (same.length <= 1) return 0
  const idx = same.findIndex((p) => p.show_id === point.show_id)
  return (idx - (same.length - 1) / 2) * 5
}

/** DB-style interval for PerformanceTooltipContent / formatPerformanceLength. */
function secondsToEntryLength(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const mm = m.toString().padStart(2, "0")
  const ss = s.toString().padStart(2, "0")
  if (h > 0) return `${h}:${mm}:${ss}`
  return `0:${mm}:${ss}`
}

function tooltipPerfForPoint(
  point: SongShowLengthPoint,
  performances: SongPerformance[],
): SongPerformance | null {
  const row = performances.find((p) => p.show_id === point.show_id)
  if (!row) return null
  return {
    ...row,
    entry_length: secondsToEntryLength(point.seconds),
  }
}

export function SongArchiveLengthBoxplot({
  performances,
}: {
  performances: SongPerformance[]
}) {
  const chartWrapRef = useRef<HTMLDivElement>(null)
  const [chartW, setChartW] = useState(0)
  const showTooltips = useIsDesktopContentLayout()

  useEffect(() => {
    const el = chartWrapRef.current
    if (!el) return

    const measure = () => {
      const w = Math.floor(el.getBoundingClientRect().width)
      if (w > 0) setChartW(w)
    }

    measure()
    const ro = new ResizeObserver(() => measure())
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const summary = useMemo(() => {
    const points = buildSongShowLengthPoints(performances)
    return summarizeSongShowLengths(points)
  }, [performances])

  if (!summary || summary.count < SONG_LENGTH_BOXPLOT_MIN_SHOWS) {
    return null
  }

  const padX = padXForWidth(chartW)
  const spanMin = summary.min
  const spanMax = summary.max
  const ariaLabel = `Performance lengths across ${summary.count} shows, from ${formatDuration(summary.min)} to ${formatDuration(summary.max)}.`

  return (
    <div className="card song-length-card song-archive-length-boxplot">
      <div className="card-head">
        <h3>Length distribution</h3>
        <span className="hd-meta">
          {summary.count} {summary.count === 1 ? "show" : "shows"}
        </span>
      </div>
      <div className="card-body song-length-card__body">
        <div
          ref={chartWrapRef}
          className="song-length-chart__chart-wrap"
          aria-label={ariaLabel}
        >
        {chartW > 0 ?
          <>
            <svg
              viewBox={`0 0 ${chartW} ${CHART_H}`}
              className="song-length-chart__svg"
              role="presentation"
              aria-hidden
            >
              <line
                className="song-length-chart__axis"
                x1={padX}
                y1={CHART_H / 2}
                x2={chartW - padX}
                y2={CHART_H / 2}
              />
              <text
                className="song-length-chart__tick"
                x={padX}
                y={CHART_H - 6}
                textAnchor="start"
              >
                {formatDuration(summary.min)}
              </text>
              <text
                className="song-length-chart__tick"
                x={chartW - padX}
                y={CHART_H - 6}
                textAnchor="end"
              >
                {formatDuration(summary.max)}
              </text>
            </svg>
            <div className="song-length-chart__points" aria-hidden={false}>
              {summary.points.map((point) => {
                const left = xPercent(point.seconds, spanMin, spanMax, padX, chartW)
                const yOff = yOffsetForPoint(point, summary.points)
                const href = getSetlistArchiveUrl(point.show_id)
                const tooltipPerf = tooltipPerfForPoint(point, performances)
                const trigger = (
                  <Link
                    href={href}
                    className="song-length-chart__point-link"
                    style={{
                      left: `${left}%`,
                      top: `calc(50% + ${yOff}px)`,
                    }}
                    aria-label={`${formatDuration(point.seconds)} — ${formatSetlistDate(point.show_date)}, ${point.show_group}. View setlist.`}
                  >
                    <span className="song-length-chart__point-dot" />
                  </Link>
                )

                if (!showTooltips || !tooltipPerf) {
                  return <span key={point.show_id} className="contents">{trigger}</span>
                }

                return (
                  <Tooltip key={point.show_id}>
                    <TooltipTrigger asChild>{trigger}</TooltipTrigger>
                    <TooltipContent {...SETLIST_V2_ROW_TOOLTIP_CONTENT}>
                      <PerformanceTooltipContent fullData={tooltipPerf} />
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          </>
        : null}
        </div>
      </div>
    </div>
  )
}
