"use client"

import { useEffect, useState } from "react"

import {
  fetchWtedEpisodeScheduleLookupsByNames,
  type WtedEpisodeScheduleLookup,
} from "@/lib/wted-episodes-schedule-lookup"
import { getWtedEpisodeDisplayName } from "@/lib/wted-episode-display-name"
import { parseWtedEpisodeHosts } from "@/lib/wted-episode-host"

const RADIO_SCHEDULE_URL =
  "https://public.radio.co/stations/s3c11c85d6/embed/schedule"

export interface RadioScheduleEvent {
  start: string
  end: string
  event_id: number
  playlist: {
    name: string
    colour: string
    artist: string
    title: string
    artwork: string
  }
}

interface RadioScheduleResponse {
  data: RadioScheduleEvent[]
}

/** `wted_episodes` row matched on Radio.co `playlist.name` (= `wted_episodes.episode`). */
export type RadioScheduleWtedEpisode = WtedEpisodeScheduleLookup

export interface RadioScheduleSlot {
  event: RadioScheduleEvent
  isNowPlaying: boolean
  /** Present when `fetchRadioScheduleMergedSlotsForLocalDay` could match `playlist.name` to `wted_episodes.episode`. */
  wtedEpisode?: RadioScheduleWtedEpisode | null
}

const SCHEDULE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
}

/** Single time label (same style as schedule row times). */
export function formatRadioScheduleTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, SCHEDULE_TIME_OPTIONS)
}

/** Time range label for Radio.co schedule rows (matches the main WTED schedule card). */
export function formatRadioScheduleTimeRange(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return `${startDate.toLocaleTimeString(undefined, SCHEDULE_TIME_OPTIONS)} – ${endDate.toLocaleTimeString(undefined, SCHEDULE_TIME_OPTIONS)}`
}

/** Merge consecutive rows when titles match and times are back-to-back; artwork stays from the first row. */
const BACK_TO_BACK_MS_TOLERANCE = 5000

/** After merging, keep this many rows visible (pull extra raw events when merges reduce the count). */
const TARGET_VISIBLE_ROWS = 5

/** Avoid unbounded work if many consecutive slots merge into one row. */
const MAX_RAW_EVENTS_FROM_ANCHOR = 32

/** Merge consecutive same-title rows when times are back-to-back (Radio.co artifacts). */
function mergeBackToBackSameTitleSlotsCore(
  slots: RadioScheduleSlot[],
): RadioScheduleSlot[] {
  if (slots.length === 0) return []

  const merged: RadioScheduleSlot[] = []
  let i = 0
  while (i < slots.length) {
    const first = slots[i]!
    let groupEnd = first.event.end
    let j = i + 1
    while (j < slots.length) {
      const next = slots[j]!
      const sameTitle =
        first.event.playlist.title.trim() === next.event.playlist.title.trim()
      const prevEnd = new Date(groupEnd).getTime()
      const nextStart = new Date(next.event.start).getTime()
      const backToBack = Math.abs(nextStart - prevEnd) <= BACK_TO_BACK_MS_TOLERANCE
      if (!sameTitle || !backToBack) break
      groupEnd = next.event.end
      j++
    }

    merged.push({
      event:
        j > i + 1
          ? { ...first.event, end: groupEnd }
          : first.event,
      isNowPlaying: false,
    })
    i = j
  }

  return merged
}

function mergeBackToBackSameTitleSlots(
  slots: RadioScheduleSlot[],
  nowMs: number,
): RadioScheduleSlot[] {
  const merged = mergeBackToBackSameTitleSlotsCore(slots)
  return merged.map((slot, idx) => ({
    ...slot,
    isNowPlaying:
      idx === 0 &&
      nowMs >= new Date(slot.event.start).getTime() &&
      nowMs < new Date(slot.event.end).getTime(),
  }))
}

function sameLocalCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Events whose **start** falls on the user's local calendar day for `day`. */
export function filterRadioEventsStartingOnLocalDay(
  events: RadioScheduleEvent[],
  day: Date,
): RadioScheduleEvent[] {
  return events
    .filter((e) => sameLocalCalendarDay(new Date(e.start), day))
    .sort(
      (a, b) =>
        new Date(a.start).getTime() - new Date(b.start).getTime(),
    )
}

/**
 * Full Radio.co day schedule for share export: merged slots + `isNowPlaying` when `now` falls in row.
 */
export async function fetchRadioScheduleMergedSlotsForLocalDay(
  day: Date = new Date(),
  nowMs: number = Date.now(),
): Promise<{ slots: RadioScheduleSlot[]; error: string | null }> {
  const logPrefix = "[radio schedule share]"
  try {
    console.log(`${logPrefix} step 1/8: request Radio.co embed schedule`, {
      url: RADIO_SCHEDULE_URL,
      localCalendarDay: day.toDateString(),
      nowMs,
      nowIso: new Date(nowMs).toISOString(),
    })

    const res = await fetch(RADIO_SCHEDULE_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json: RadioScheduleResponse = await res.json()
    if (!json.data?.length) {
      console.log(`${logPrefix} step 2/8: API returned no events — nothing to render`, {
        localCalendarDay: day.toDateString(),
      })
      return { slots: [], error: null }
    }

    console.log(`${logPrefix} step 2/8: API response`, {
      totalEventsInPayload: json.data.length,
      sampleFirstEvent: {
        playlistName: json.data[0]?.playlist?.name,
        title: json.data[0]?.playlist?.title,
        start: json.data[0]?.start,
        end: json.data[0]?.end,
      },
    })

    const filtered = filterRadioEventsStartingOnLocalDay(json.data, day)
    console.log(`${logPrefix} step 3/8: filter to local calendar day (event.start in viewer timezone)`, {
      rule:
        "Keep rows where start date matches the same Y/M/D as `localCalendarDay`; sort by start time.",
      localCalendarDay: day.toDateString(),
      keptCount: filtered.length,
      rows: filtered.map((e) => ({
        event_id: e.event_id,
        playlistName: e.playlist.name,
        title: e.playlist.title,
        start: e.start,
        end: e.end,
      })),
    })

    const rawSlots: RadioScheduleSlot[] = filtered.map((event) => ({
      event,
      isNowPlaying: false,
    }))
    const merged = mergeBackToBackSameTitleSlotsCore(rawSlots)
    console.log(`${logPrefix} step 4/8: merge consecutive Radio.co rows`, {
      rule:
        "Same trimmed playlist.title and start/end within 5s back-to-back → one row with extended end (first row’s artwork/name kept).",
      beforeMergeCount: rawSlots.length,
      afterMergeCount: merged.length,
    })

    const slotsBase = merged.map((slot) => ({
      ...slot,
      isNowPlaying:
        nowMs >= new Date(slot.event.start).getTime() &&
        nowMs < new Date(slot.event.end).getTime(),
    }))
    const onAirIndices = slotsBase
      .map((s, i) => (s.isNowPlaying ? i : -1))
      .filter((i) => i >= 0)
    console.log(`${logPrefix} step 5/8: which row is “now playing” (for data only; PNG has no on-air UI)`, {
      onAirRowIndices: onAirIndices,
      perRow: slotsBase.map((s, i) => ({
        i,
        playlistName: s.event.playlist.name,
        start: s.event.start,
        end: s.event.end,
        isNowPlaying: s.isNowPlaying,
      })),
    })

    const episodeKeys = slotsBase.map((s) => s.event.playlist.name?.trim() ?? "")
    const uniqueEpisodeKeys = [...new Set(episodeKeys.filter(Boolean))]
    console.log(`${logPrefix} step 6/8: Supabase lookup keys (= Radio playlist.name → wted_episodes.episode)`, {
      uniqueKeyCount: uniqueEpisodeKeys.length,
      keys: uniqueEpisodeKeys,
    })

    const episodeMap = await fetchWtedEpisodeScheduleLookupsByNames(episodeKeys)
    const matchedKeys = uniqueEpisodeKeys.filter((k) => episodeMap.has(k))
    const unmatchedKeys = uniqueEpisodeKeys.filter((k) => !episodeMap.has(k))
    console.log(`${logPrefix} step 7/8: wted_episodes join result`, {
      rowsResolvedFromSupabase: episodeMap.size,
      matchedEpisodeKeys: matchedKeys,
      unmatchedEpisodeKeys: unmatchedKeys,
      note: "Show ribbon + DB title/art when key matched; only REMOVED rows excluded from lookup (skipped still resolves for this PNG).",
    })

    const slots: RadioScheduleSlot[] = slotsBase.map((s) => {
      const key = s.event.playlist.name?.trim()
      const wtedEpisode =
        key ? (episodeMap.get(key) ?? null) : null
      return { ...s, wtedEpisode }
    })

    const displayPlan = slots.map((s, i) => {
      const playlistName = s.event.playlist.name?.trim() ?? ""
      const radioTitle = s.event.playlist.title?.trim() ?? ""
      const wted = s.wtedEpisode
      const mainTitle = wted
        ? getWtedEpisodeDisplayName(playlistName, wted.display_name)
        : (radioTitle || playlistName)
      const hasShowRibbon = Boolean(wted)
      const artworkSource =
        wted?.artwork?.trim() ?
          "wted_episodes.artwork"
        : s.event.playlist.artwork?.trim() ?
          "radio playlist.artwork"
        : "placeholder (no URL)"
      const timeLine = formatRadioScheduleTimeRange(s.event.start, s.event.end)
      const hostPillNames =
        wted ?
          parseWtedEpisodeHosts(wted.host)
            .map((h) => h.name.trim())
            .filter(Boolean)
        : []

      return {
        rowIndex: i,
        layout: "schedule row (show ribbon optional, title, start–end time range only)",
        lookupKeyPlaylistName: playlistName || null,
        dbMatched: wted != null,
        showRibbonText: wted?.show ?? null,
        showRibbonRendered: hasShowRibbon,
        mainTitleUsedInPng: mainTitle,
        mainTitleRule: wted ?
          "getWtedEpisodeDisplayName(playlistName, display_name)"
        : "radio title, else playlist.name",
        artworkSource,
        timeLineInPng: timeLine,
        hostPillNames,
        isNowPlayingSlot: s.isNowPlaying,
      }
    })

    console.log(`${logPrefix} step 8/8: PNG row model (matches WlHomeV2RadioScheduleShareExportCard)`, {
      rowCount: displayPlan.length,
      rows: displayPlan,
    })

    return { slots, error: null }
  } catch (err) {
    console.warn(`${logPrefix} fetch failed`, err)
    return {
      slots: [],
      error: err instanceof Error ? err.message : "Failed to load schedule",
    }
  }
}

function parseScheduleData(data: RadioScheduleEvent[]): RadioScheduleSlot[] {
  const now = new Date().getTime()

  // Find index where current time is between start and end
  let currentIndex = data.findIndex((item) => {
    const start = new Date(item.start).getTime()
    const end = new Date(item.end).getTime()
    return now >= start && now < end
  })

  // If not found (e.g. gap or before/after schedule), use first upcoming
  if (currentIndex === -1) {
    currentIndex = data.findIndex((item) => new Date(item.start).getTime() > now)
    if (currentIndex === -1) {
      currentIndex = 0 // Fallback to first item
    }
  }

  const slots: RadioScheduleSlot[] = []
  let merged: RadioScheduleSlot[] = []

  const end = Math.min(data.length, currentIndex + MAX_RAW_EVENTS_FROM_ANCHOR)
  for (let idx = currentIndex; idx < end; idx++) {
    slots.push({
      event: data[idx]!,
      isNowPlaying: false,
    })
    merged = mergeBackToBackSameTitleSlots(slots, now)
    if (merged.length >= TARGET_VISIBLE_ROWS) {
      return merged.slice(0, TARGET_VISIBLE_ROWS)
    }
  }

  return merged
}

export function useRadioSchedule() {
  const [slots, setSlots] = useState<RadioScheduleSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchSchedule() {
      try {
        const res = await fetch(RADIO_SCHEDULE_URL)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json: RadioScheduleResponse = await res.json()
        if (!cancelled && json.data) {
          setSlots(parseScheduleData(json.data))
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load schedule")
          setSlots([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchSchedule()

    // Refresh every 5 minutes
    const interval = setInterval(fetchSchedule, 5 * 60 * 1000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return { slots, loading, error }
}
