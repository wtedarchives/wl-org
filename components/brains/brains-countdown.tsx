"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import { serverNowMs } from "@/hooks/use-brains-access"
import { brainsCountdownTone, formatBrainsCountdown } from "@/lib/brains-window"
import { cn } from "@/lib/utils"

const TONE_CLASS = {
  normal: "text-white/70",
  warn: "text-amber-300",
  urgent: "text-rose-300",
  expired: "text-rose-400",
} as const

interface BrainsCountdownProps {
  /** When the window closes. */
  endsAt: string
  /** serverNow − clientNow, from useBrainsAccess. */
  offsetMs: number
  /** Fired once, when the window closes while the page is open. */
  onExpire?: () => void
}

/**
 * `h:mm:ss` until edit access ends.
 *
 * Owns its own 1Hz interval so the ticking digits re-render this component alone
 * rather than the whole setlist below it.
 *
 * Counts against the server-corrected clock, not `Date.now()` — a laptop an hour
 * fast would otherwise promise time the server will refuse to honour.
 */
export function BrainsCountdown({
  endsAt,
  offsetMs,
  onExpire,
}: BrainsCountdownProps) {
  const endMs = useMemo(() => new Date(endsAt).getTime(), [endsAt])
  const [remaining, setRemaining] = useState(
    () => endMs - serverNowMs(offsetMs),
  )

  // Held in a ref so an inline callback from the parent cannot restart the
  // interval on every render.
  const onExpireRef = useRef(onExpire)
  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  const firedRef = useRef(false)
  useEffect(() => {
    firedRef.current = false
  }, [endsAt])

  useEffect(() => {
    const evaluate = () => {
      const next = endMs - serverNowMs(offsetMs)
      setRemaining(next)
      if (next <= 0 && !firedRef.current) {
        firedRef.current = true
        onExpireRef.current?.()
      }
    }
    // Run once immediately so a window that is already closed on mount locks the
    // page without waiting a second for the first tick.
    evaluate()
    const id = window.setInterval(evaluate, 1000)
    return () => window.clearInterval(id)
  }, [endMs, offsetMs])

  const tone = brainsCountdownTone(remaining)

  return (
    <span
      className={cn(
        "font-mono text-xs font-medium tabular-nums tracking-[0.04em]",
        TONE_CLASS[tone],
      )}
      // Ticking digits would otherwise be announced every second.
      aria-live="off"
      title={
        tone === "expired"
          ? "Your editing window has closed"
          : "Time left to edit this setlist"
      }
    >
      {tone === "expired" ? "Window closed" : formatBrainsCountdown(remaining)}
    </span>
  )
}
