"use client"

import { useEffect, useState } from "react"

import {
  formatEchoCompactRemaining,
  getEchoLockCountdown,
  type EchoLockCountdown,
} from "@/lib/echo-of-a-show"

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

export function EchoOfAShowCountdown({
  showTime,
  compact = false,
  fill = false,
}: {
  showTime: string
  compact?: boolean
  fill?: boolean
}) {
  const [countdown, setCountdown] = useState<EchoLockCountdown>(() =>
    getEchoLockCountdown(showTime),
  )

  useEffect(() => {
    const tick = () => setCountdown(getEchoLockCountdown(showTime))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [showTime])

  if (compact) {
    return (
      <span className="echo-of-a-show__remaining-time">
        {formatEchoCompactRemaining(countdown)}
      </span>
    )
  }

  if (countdown.isClosed) {
    return <span className="echo-of-a-show__meta">Locked</span>
  }

  return (
    <span
      className={
        fill
          ? "echo-of-a-show__countdown echo-of-a-show__countdown--fill"
          : "echo-of-a-show__countdown"
      }
      aria-label="Time until picks lock"
    >
      <span className="echo-of-a-show__count-cell">
        <span className="echo-of-a-show__count-num">{pad2(countdown.days)}</span>
        <span className="echo-of-a-show__count-label">days</span>
      </span>
      <span className="echo-of-a-show__count-cell">
        <span className="echo-of-a-show__count-num">{pad2(countdown.hours)}</span>
        <span className="echo-of-a-show__count-label">hrs</span>
      </span>
      <span className="echo-of-a-show__count-cell">
        <span className="echo-of-a-show__count-num">
          {pad2(countdown.minutes)}
        </span>
        <span className="echo-of-a-show__count-label">min</span>
      </span>
    </span>
  )
}
