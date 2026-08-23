"use client"

import { useCallback, useEffect, useState } from "react"

import { formatRadioTrackClock } from "@/lib/wted-radio-track-display-title"

const STORAGE_KEY = "wted-ios-radio-clock-mode"

type ClockMode = "down" | "up"

function readClockMode(): ClockMode {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === "up" || stored === "down") return stored
  } catch {
    // private mode / quota
  }
  return "down"
}

function writeClockMode(mode: ClockMode) {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    // private mode / quota
  }
}

export function IosRadioBarCountdown({
  elapsed,
  remaining,
  totalDuration,
}: {
  elapsed: number | null
  remaining: number | null
  totalDuration: number | null
}) {
  const [mode, setMode] = useState<ClockMode>("down")

  useEffect(() => {
    setMode(readClockMode())
  }, [])

  const toggle = useCallback(() => {
    setMode((prev) => {
      const next = prev === "down" ? "up" : "down"
      writeClockMode(next)
      return next
    })
  }, [])

  const primary = mode === "up" ? elapsed : remaining
  if (primary == null || remaining == null) return null

  return (
    <button
      type="button"
      className="ios-radio-bar__countdown"
      onClick={toggle}
      aria-pressed={mode === "up"}
      aria-label={
        mode === "down" ?
          "Switch to elapsed time"
        : "Switch to time remaining"
      }
    >
      {formatRadioTrackClock(primary)}
      {totalDuration != null ?
        <span className="ios-radio-bar__countdown-total">
          <span className="ios-radio-bar__countdown-sep">
            {"\u00A0\u00A0//\u00A0\u00A0"}
          </span>
          {formatRadioTrackClock(totalDuration)}
        </span>
      : null}
    </button>
  )
}
