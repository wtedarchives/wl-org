"use client"

import type { RadioScheduleSlot } from "@/hooks/use-radio-schedule"
import {
  formatRadioScheduleTime,
  formatRadioScheduleTimeRange,
} from "@/hooks/use-radio-schedule"

/** First merged slot + next two — same `slots` ordering as {@link WtedRadioScheduleCard}. */
export function WlHomeV2OnAirPill({
  onOpenSchedule,
  slots,
  loading,
  error,
}: {
  /** Opens the home schedule modal (full Radio.co embed), same as the old schedule card. */
  onOpenSchedule: () => void
  slots: RadioScheduleSlot[]
  loading: boolean
  error: string | null
}) {
  const first = slots[0]
  const upcoming = slots.slice(1, 3)
  const title = first?.event.playlist.title?.trim()
  const showTitle = Boolean(title) && !error
  const untilLabel =
    !loading && !error && first ?
      `ON AIR until ${formatRadioScheduleTime(first.event.end)}`
    : loading ?
      "ON AIR …"
    : "ON AIR"

  return (
    <button
      type="button"
      className="live-pill live-pill--wted-tile"
      aria-label="Open full WTED schedule"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onOpenSchedule()
      }}
    >
      <div
        className="live-pill--wted-tile-inner"
        aria-live="polite"
        aria-busy={loading}
      >
        <div className="live-pill-on-air-row">
          <span className="live-dot" aria-hidden />
          <span className="live-pill-body">
            <span className="live-pill-sub">{untilLabel}</span>
            {!loading && showTitle ? (
              <span className="live-pill-title" title={title}>
                {title}
              </span>
            ) : null}
          </span>
        </div>
        {!loading && !error && upcoming.length > 0 ?
          upcoming.map((slot) => {
            const t = slot.event.playlist.title?.trim()
            if (!t) return null
            const timeRange = formatRadioScheduleTimeRange(
              slot.event.start,
              slot.event.end,
            )
            return (
              <div
                key={slot.event.event_id}
                className="live-pill-upcoming"
              >
                <span className="live-pill-upcoming-title" title={t}>
                  {t}
                </span>
                <span className="live-pill-upcoming-time">{timeRange}</span>
              </div>
            )
          })
        : null}
      </div>
    </button>
  )
}
