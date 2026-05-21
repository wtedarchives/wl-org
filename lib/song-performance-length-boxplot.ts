import { formatDuration, parseDuration } from "@/components/dpro/tours/tour-song-stats-duration"
import type { SongPerformance } from "@/types/song"

/** Minimum qualifying shows (with lengths) before the chart is shown. */
export const SONG_LENGTH_BOXPLOT_MIN_SHOWS = 5

/** Excluded for show qualification; `partial` and empty/null are not excluded. */
export const SONG_LENGTH_BOXPLOT_EXCLUDED_SHORTS = new Set([
  "aborted",
  "fake",
  "reprise",
  "tease",
])

export type SongShowLengthPoint = {
  show_id: string
  show_date: string
  show_group: string
  show_subvenue: string
  show_venue_location: string | null
  show_tour: string | null
  seconds: number
}

export type SongShowLengthChartSummary = {
  min: number
  max: number
  count: number
  points: SongShowLengthPoint[]
}

export function songLengthBoxplotExcludedShort(
  entryShort: string | null | undefined,
): boolean {
  const s = (entryShort ?? "").toLowerCase().trim()
  return SONG_LENGTH_BOXPLOT_EXCLUDED_SHORTS.has(s)
}

export function parseEntryLengthSeconds(length: string | null | undefined): number {
  const trimmed = length?.trim()
  if (!trimmed) return 0
  return parseDuration(trimmed) ?? 0
}

/**
 * One total length (seconds) per canonical show.
 * Canon only; per-show sum after qualification; no UI filters.
 */
export function buildSongShowLengthPoints(
  performances: SongPerformance[],
): SongShowLengthPoint[] {
  const byShow = new Map<string, SongPerformance[]>()

  for (const p of performances) {
    if (p.show_canonid == null || !p.show_id) continue
    const list = byShow.get(p.show_id) ?? []
    list.push(p)
    byShow.set(p.show_id, list)
  }

  const out: SongShowLengthPoint[] = []

  for (const [showId, rows] of byShow.entries()) {
    const qualifies = rows.some(
      (r) => !songLengthBoxplotExcludedShort(r.entry_short),
    )
    if (!qualifies) continue

    let total = 0
    let hasLength = false
    for (const r of rows) {
      if (!r.entry_length?.trim()) continue
      hasLength = true
      total += parseEntryLengthSeconds(r.entry_length)
    }
    if (!hasLength) continue

    const head = rows[0]!
    out.push({
      show_id: showId,
      show_date: head.show_date,
      show_group: head.show_group,
      show_subvenue: head.show_subvenue,
      show_venue_location: head.show_venue_location,
      show_tour: head.show_tour,
      seconds: total,
    })
  }

  return out.sort((a, b) => a.seconds - b.seconds || a.show_date.localeCompare(b.show_date))
}

export function summarizeSongShowLengths(
  points: SongShowLengthPoint[],
): SongShowLengthChartSummary | null {
  if (points.length === 0) return null
  const seconds = points.map((p) => p.seconds)
  return {
    min: Math.min(...seconds),
    max: Math.max(...seconds),
    count: points.length,
    points,
  }
}

/** @deprecated Use buildSongShowLengthPoints */
export function buildSongShowLengthSeconds(
  performances: SongPerformance[],
): number[] {
  return buildSongShowLengthPoints(performances).map((p) => p.seconds)
}
