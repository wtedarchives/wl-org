import {
  addLocalCalendarDays,
  startOfLocalCalendarDay,
} from "@/lib/wl-home-v2-radio-schedule-share-export-days"
import type { WtedEpisodeScheduleLookup } from "@/lib/wted-episodes-schedule-lookup"

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

export const RADIO_SCHEDULE_WEEK_DAY_COUNT = 7

/** Consecutive merged rows with the same title must be back-to-back within this tolerance (Radio.co artifacts). */
const BACK_TO_BACK_MS_TOLERANCE = 5000

export type RadioScheduleDaySlot = {
  event: RadioScheduleEvent
  displayStart: string
  displayEnd: string
  isNowPlaying: boolean
  slotKey: string
  /** Matched from Radio.co `playlist.name` → `wted_episodes.episode` (when loaded). */
  wtedEpisode?: WtedEpisodeScheduleLookup | null
}

export type RadioScheduleDay = {
  day: Date
  label: string
  slots: RadioScheduleDaySlot[]
}

type ClippedEntry = {
  event: RadioScheduleEvent
  displayStart: Date
  displayEnd: Date
  actualStart: Date
  actualEnd: Date
}

function isInstantOnLocalDay(instant: Date, day: Date): boolean {
  const dayStart = startOfLocalCalendarDay(day)
  const dayEnd = addLocalCalendarDays(dayStart, 1)
  const t = instant.getTime()
  return t >= dayStart.getTime() && t < dayEnd.getTime()
}

/** Show belongs on this local day when either its start or end falls on that day. */
export function eventBelongsToLocalDay(
  event: RadioScheduleEvent,
  day: Date,
): boolean {
  const start = new Date(event.start)
  const end = new Date(event.end)
  return isInstantOnLocalDay(start, day) || isInstantOnLocalDay(end, day)
}

function clipEventToLocalDay(
  event: RadioScheduleEvent,
  day: Date,
): ClippedEntry | null {
  if (!eventBelongsToLocalDay(event, day)) return null

  const dayStart = startOfLocalCalendarDay(day)
  const dayEnd = addLocalCalendarDays(dayStart, 1)
  const actualStart = new Date(event.start)
  const actualEnd = new Date(event.end)

  const displayStart =
    actualStart.getTime() < dayStart.getTime() ? dayStart : actualStart
  const displayEnd =
    actualEnd.getTime() > dayEnd.getTime() ? dayEnd : actualEnd

  if (displayStart.getTime() >= displayEnd.getTime()) return null

  return { event, displayStart, displayEnd, actualStart, actualEnd }
}

function mergeBackToBackSameTitleEntries(
  entries: ClippedEntry[],
  nowMs: number,
): RadioScheduleDaySlot[] {
  if (entries.length === 0) return []

  const merged: RadioScheduleDaySlot[] = []
  let i = 0
  while (i < entries.length) {
    const first = entries[i]!
    let groupDisplayEnd = first.displayEnd
    let groupActualEnd = first.actualEnd
    let j = i + 1
    while (j < entries.length) {
      const next = entries[j]!
      const sameTitle =
        first.event.playlist.title.trim() === next.event.playlist.title.trim()
      const prevEnd = groupDisplayEnd.getTime()
      const nextStart = next.displayStart.getTime()
      const backToBack =
        Math.abs(nextStart - prevEnd) <= BACK_TO_BACK_MS_TOLERANCE
      if (!sameTitle || !backToBack) break
      groupDisplayEnd = next.displayEnd
      groupActualEnd = next.actualEnd
      j++
    }

    const actualStart = first.actualStart
    const isNowPlaying =
      nowMs >= actualStart.getTime() && nowMs < groupActualEnd.getTime()

    merged.push({
      event: first.event,
      displayStart: first.displayStart.toISOString(),
      displayEnd: groupDisplayEnd.toISOString(),
      isNowPlaying,
      slotKey: `${first.event.event_id}-${first.displayStart.getTime()}`,
    })
    i = j
  }

  return merged
}

export function formatRadioScheduleDayTabLabel(day: Date): string {
  return new Intl.DateTimeFormat(undefined, { weekday: "short" })
    .format(day)
    .replace(/\./g, "")
    .toUpperCase()
}

function clipAndMergeEventsForLocalDay(
  events: RadioScheduleEvent[],
  day: Date,
  nowMs: number,
): RadioScheduleDaySlot[] {
  const clipped: ClippedEntry[] = []
  for (const event of events) {
    const entry = clipEventToLocalDay(event, day)
    if (entry) clipped.push(entry)
  }
  clipped.sort(
    (a, b) => a.displayStart.getTime() - b.displayStart.getTime(),
  )
  return mergeBackToBackSameTitleEntries(clipped, nowMs)
}

export function buildRadioScheduleDays(
  events: RadioScheduleEvent[],
  options?: {
    anchor?: Date
    dayCount?: number
    nowMs?: number
  },
): RadioScheduleDay[] {
  const anchor = options?.anchor ?? new Date()
  const dayCount = options?.dayCount ?? RADIO_SCHEDULE_WEEK_DAY_COUNT
  const nowMs = options?.nowMs ?? Date.now()
  const today = startOfLocalCalendarDay(anchor)

  const sorted = [...events].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  )

  return Array.from({ length: dayCount }, (_, i) => {
    const day = addLocalCalendarDays(today, i)
    return {
      day,
      label: i === 0 ? "today" : formatRadioScheduleDayTabLabel(day),
      slots: clipAndMergeEventsForLocalDay(sorted, day, nowMs),
    }
  })
}

export function getRadioScheduleSlotsForLocalDay(
  events: RadioScheduleEvent[],
  day: Date,
  nowMs: number = Date.now(),
): RadioScheduleDaySlot[] {
  const sorted = [...events].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  )
  return clipAndMergeEventsForLocalDay(sorted, day, nowMs)
}

/** Map day slots to legacy {@link RadioScheduleSlot} rows (display times on `event`). */
export function radioScheduleDaySlotsToLegacySlots(
  daySlots: RadioScheduleDaySlot[],
): Array<{
  event: RadioScheduleEvent
  isNowPlaying: boolean
}> {
  return daySlots.map((slot) => ({
    isNowPlaying: slot.isNowPlaying,
    event: {
      ...slot.event,
      start: slot.displayStart,
      end: slot.displayEnd,
    },
  }))
}
