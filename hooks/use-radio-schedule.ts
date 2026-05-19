"use client"

import { useEffect, useState } from "react"

import {
  extractRadioCoPlaylistIdFromArtworkUrl,
  fetchWtedEpisodeScheduleLookupsByNames,
  fetchWtedEpisodeScheduleLookupsByRadioIds,
  type WtedEpisodeScheduleLookup,
} from "@/lib/wted-episodes-schedule-lookup"

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

/** `wted_episodes` row matched on Radio.co `playlist.name` (= `episode`) or fallback `radio_id` from artwork URL. */
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
  try {
    const res = await fetch(RADIO_SCHEDULE_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json: RadioScheduleResponse = await res.json()
    if (!json.data?.length) {
      return { slots: [], error: null }
    }

    const filtered = filterRadioEventsStartingOnLocalDay(json.data, day)

    const rawSlots: RadioScheduleSlot[] = filtered.map((event) => ({
      event,
      isNowPlaying: false,
    }))
    const merged = mergeBackToBackSameTitleSlotsCore(rawSlots)

    const slotsBase = merged.map((slot) => ({
      ...slot,
      isNowPlaying:
        nowMs >= new Date(slot.event.start).getTime() &&
        nowMs < new Date(slot.event.end).getTime(),
    }))

    const episodeKeys = slotsBase.map((s) => s.event.playlist.name?.trim() ?? "")
    const episodeMap = await fetchWtedEpisodeScheduleLookupsByNames(episodeKeys)

    const radioIdsFromArtwork = slotsBase
      .map((s) =>
        extractRadioCoPlaylistIdFromArtworkUrl(s.event.playlist.artwork ?? ""),
      )
      .filter((id): id is string => Boolean(id))
    const uniqueRadioIds = [...new Set(radioIdsFromArtwork)]

    const radioMap =
      await fetchWtedEpisodeScheduleLookupsByRadioIds(uniqueRadioIds)

    const slots: RadioScheduleSlot[] = slotsBase.map((s) => {
      const key = s.event.playlist.name?.trim()
      const byEpisode = key ? episodeMap.get(key) ?? null : null
      const rid = extractRadioCoPlaylistIdFromArtworkUrl(
        s.event.playlist.artwork ?? "",
      )
      const byRadioId =
        byEpisode ? null : (rid ? radioMap.get(rid) ?? null : null)
      const wtedEpisode = byEpisode ?? byRadioId ?? null
      return { ...s, wtedEpisode }
    })

    return { slots, error: null }
  } catch (err) {
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
