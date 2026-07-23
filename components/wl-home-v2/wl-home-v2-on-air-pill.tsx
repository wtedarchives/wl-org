"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

import {
  formatRadioScheduleTimeRange,
  type RadioScheduleDay,
} from "@/hooks/use-radio-schedule"
import { resolveRadioScheduleSlotTitle } from "@/lib/wted-episodes-schedule-lookup"
import { cn } from "@/lib/utils"

const WL_HOME_V2_ON_AIR_TABLIST_ID = "wl-home-v2-on-air-schedule-tabs"

function WlHomeV2OnAirScheduleRowArt({
  artwork,
}: {
  artwork: string | null | undefined
}) {
  const src = artwork?.trim()
  if (!src) {
    return (
      <span
        className="live-pill-upcoming-art live-pill-upcoming-art--placeholder"
        aria-hidden
      />
    )
  }

  return (
    <span className="live-pill-upcoming-art">
      <Image
        src={src}
        alt=""
        width={32}
        height={32}
        className="live-pill-upcoming-art-img"
        unoptimized
      />
    </span>
  )
}

function WlHomeV2OnAirScheduleRow({
  slot,
}: {
  slot: RadioScheduleDay["slots"][number]
}) {
  const label = resolveRadioScheduleSlotTitle(slot.event, slot.wtedEpisode)
  if (!label) return null

  const artwork = slot.wtedEpisode?.artwork?.trim() || "/WL.png"
  const href = slot.wtedEpisode?.scheduleLinkHref ?? null
  const timeRange = formatRadioScheduleTimeRange(
    slot.displayStart,
    slot.displayEnd,
  )

  const rowClassName = cn(
    slot.isNowPlaying ?
      "live-pill-upcoming live-pill-upcoming--on-air"
    : "live-pill-upcoming",
    href && "live-pill-upcoming--linked",
  )

  const stopTileClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const onAirContent = (
    <>
      <WlHomeV2OnAirScheduleRowArt artwork={artwork} />
      <div className="live-pill-upcoming-main">
        <span className="live-pill-upcoming-title" title={label}>
          {label}
        </span>
        <span className="live-pill-upcoming-time">{timeRange}</span>
      </div>
      <span className="live-pill live-pill--on-air-badge">
        <span className="live-dot" aria-hidden />
        ON AIR
      </span>
    </>
  )

  const upcomingContent = (
    <>
      <WlHomeV2OnAirScheduleRowArt artwork={artwork} />
      <div className="live-pill-upcoming-body">
        <span className="live-pill-upcoming-title" title={label}>
          {label}
        </span>
        <span className="live-pill-upcoming-time">{timeRange}</span>
      </div>
    </>
  )

  if (slot.isNowPlaying) {
    if (href) {
      return (
        <Link
          href={href}
          className={rowClassName}
          onClick={stopTileClick}
        >
          {onAirContent}
        </Link>
      )
    }
    return <div className={rowClassName}>{onAirContent}</div>
  }

  if (href) {
    return (
      <Link href={href} className={rowClassName} onClick={stopTileClick}>
        {upcomingContent}
      </Link>
    )
  }

  return <div className={rowClassName}>{upcomingContent}</div>
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
  const tabListId = WL_HOME_V2_ON_AIR_TABLIST_ID

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
        : days.every((day) => day.slots.length === 0) ?
          <p className="wl-home-v2-radio-on-air-status">
            No shows scheduled for this day.
          </p>
        : <div className="wl-home-v2-radio-on-air-day-panels">
            {days.map((day, index) => (
              <div
                key={day.day.toISOString()}
                id={`${tabListId}-panel-${index}`}
                role="tabpanel"
                aria-labelledby={`${tabListId}-tab-${index}`}
                hidden={index !== selectedIndex}
                className="wl-home-v2-radio-on-air-day-panel"
              >
                {day.slots.length === 0 ?
                  <p className="wl-home-v2-radio-on-air-status">
                    No shows scheduled for this day.
                  </p>
                : day.slots.map((slot) => (
                    <WlHomeV2OnAirScheduleRow key={slot.slotKey} slot={slot} />
                  ))
                }
              </div>
            ))}
          </div>
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
            aria-controls={`${tabListId}-panel-${index}`}
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
