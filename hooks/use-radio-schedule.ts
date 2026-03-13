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

function parseScheduleData(data: RadioScheduleEvent[]): RadioScheduleSlot[] {
  const now = new Date().getTime()

  // Find index where current time is between start and end
  let currentIndex = data.findIndex((item) => {
    const start = new Date(item.start).getTime()
    const end = new Date(item.end).getTime()
    return now >= start && now < end
  })

  let hasNowPlaying = currentIndex >= 0

  // If not found (e.g. gap or before/after schedule), use first upcoming
  if (currentIndex === -1) {
    currentIndex = data.findIndex((item) => new Date(item.start).getTime() > now)
    if (currentIndex === -1) {
      currentIndex = 0 // Fallback to first item
    }
  }

  const slots: RadioScheduleSlot[] = []
  const count = Math.min(5, data.length - currentIndex) // current + up to 4 next

  for (let i = 0; i < count; i++) {
    const idx = currentIndex + i
    if (idx >= data.length) break
    slots.push({
      event: data[idx],
      isNowPlaying: hasNowPlaying && i === 0,
    })
  }

  return slots
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
