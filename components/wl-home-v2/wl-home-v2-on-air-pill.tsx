"use client"

import { useEffect, useId, useState } from "react"

import {
  formatRadioScheduleTimeRange,
  type RadioScheduleDay,
} from "@/hooks/use-radio-schedule"
import { cn } from "@/lib/utils"

function WlHomeV2OnAirScheduleRow({
  slot,
}: {
  slot: RadioScheduleDay["slots"][number]
}) {
  const title = slot.event.playlist.title?.trim()
  if (!title) return null

  const timeRange = formatRadioScheduleTimeRange(
    slot.displayStart,
    slot.displayEnd,
  )

  if (slot.isNowPlaying) {
    return (
      <div className="live-pill-upcoming live-pill-upcoming--on-air">
        <div className="live-pill-upcoming-main">
          <span className="live-pill-upcoming-title" title={title}>
            {title}
          </span>
          <span className="live-pill-upcoming-time">{timeRange}</span>
        </div>
        <span className="live-pill live-pill--on-air-badge">
          <span className="live-dot" aria-hidden />
          ON AIR
        </span>
      </div>
    )
  }

  return (
    <div className="live-pill-upcoming">
      <span className="live-pill-upcoming-title" title={title}>
        {title}
      </span>
      <span className="live-pill-upcoming-time">{timeRange}</span>
    </div>
  )
}

export function WlHomeV2OnAirPill({
  days,
  loading,
  error,
}: {
  days: RadioScheduleDay[]
  loading: boolean
  error: string | null
}) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [panelVisible, setPanelVisible] = useState(true)
  const tabListId = useId()

  const activeDay = days[selectedIndex]
  const activeSlots = activeDay?.slots ?? []

  useEffect(() => {
    setPanelVisible(false)
    const id = window.requestAnimationFrame(() => setPanelVisible(true))
    return () => window.cancelAnimationFrame(id)
  }, [selectedIndex])

  return (
    <div className="wl-home-v2-radio-on-air-panel">
      <div className="wp-head">
        <span>Upcoming Schedule</span>
      </div>

      <div
        role="tabpanel"
        id={`${tabListId}-panel`}
        aria-labelledby={`${tabListId}-tab-${selectedIndex}`}
        className={cn(
          "live-pill--wted-tile-inner wl-home-v2-radio-on-air-list",
          panelVisible && "wl-home-v2-radio-on-air-list--visible",
        )}
        aria-live="polite"
        aria-busy={loading}
      >
        {loading ?
          <p className="wl-home-v2-radio-on-air-status">Loading schedule…</p>
        : error ?
          <p className="wl-home-v2-radio-on-air-status">Schedule unavailable</p>
        : activeSlots.length === 0 ?
          <p className="wl-home-v2-radio-on-air-status">
            No shows scheduled for this day.
          </p>
        : activeSlots.map((slot) => (
            <WlHomeV2OnAirScheduleRow key={slot.slotKey} slot={slot} />
          ))
        }
      </div>

      <div
        className="wl-home-v2-radio-on-air-tabs"
        role="tablist"
        aria-label="WTED schedule by day"
        id={tabListId}
      >
        {days.map((day, index) => (
          <button
            key={day.day.toISOString()}
            type="button"
            role="tab"
            id={`${tabListId}-tab-${index}`}
            aria-selected={selectedIndex === index}
            aria-controls={`${tabListId}-panel`}
            className={cn(
              "wl-home-v2-radio-on-air-tab",
              selectedIndex === index && "wl-home-v2-radio-on-air-tab--active",
            )}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setSelectedIndex(index)
            }}
          >
            {day.label}
          </button>
        ))}
      </div>
    </div>
  )
}
