"use client"

import { useEffect, useState } from "react"

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

export interface RadioScheduleSlot {
  event: RadioScheduleEvent
  isNowPlaying: boolean
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

function mergeBackToBackSameTitleSlots(
  slots: RadioScheduleSlot[],
  nowMs: number,
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

  return merged.map((slot, idx) => ({
    ...slot,
    isNowPlaying:
      idx === 0 &&
      nowMs >= new Date(slot.event.start).getTime() &&
      nowMs < new Date(slot.event.end).getTime(),
  }))
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
