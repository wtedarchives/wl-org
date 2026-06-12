"use client"

import {
  CircleNotch,
  DiceFive,
  DiceFour,
  DiceOne,
  DiceSix,
  DiceThree,
  DiceTwo,
} from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import { fetchRandomShowId } from "@/lib/fetch-random-show-id"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { cn } from "@/lib/utils"

const DICE_ICONS = [
  DiceOne,
  DiceTwo,
  DiceThree,
  DiceFour,
  DiceFive,
  DiceSix,
] as const

const DICE_CYCLE_MS = 420

function RotatingDiceIcon({
  size,
  className,
}: {
  size: number
  className?: string
}) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % DICE_ICONS.length)
    }, DICE_CYCLE_MS)
    return () => window.clearInterval(id)
  }, [])

  const Icon = DICE_ICONS[index]
  return (
    <Icon
      className={cn("wl-home-v2-archive-random-btn__icon", className)}
      size={size}
      weight="regular"
      aria-hidden
    />
  )
}

export function WlHomeV2ArchiveRandomShowButton({
  variant = "tile",
  onNavigate,
}: {
  variant?: "tile" | "tile-action" | "subnav"
  /** Close mobile menu after navigation (header drawer). */
  onNavigate?: () => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const iconSize =
    variant === "subnav" ? 14
    : 18

  const handleClick = useCallback(async () => {
    if (loading) return
    setLoading(true)
    try {
      const showId = await fetchRandomShowId()
      if (showId) {
        onNavigate?.()
        router.push(getSetlistArchiveUrl(showId))
      }
    } finally {
      setLoading(false)
    }
  }, [loading, onNavigate, router])

  if (variant === "tile-action") {
    return (
      <button
        type="button"
        className="wbtn wbtn--app-store wl-home-v2-archive-random-btn--tile-action"
        onClick={() => void handleClick()}
        disabled={loading}
        aria-label="Random Show"
      >
        <span className="wbtn-text">Random Show</span>
        {loading ?
          <CircleNotch
            className="wbtn-icon wl-home-v2-archive-random-btn__icon--spin"
            size={iconSize}
            weight="bold"
            aria-hidden
          />
        : <RotatingDiceIcon size={iconSize} className="wbtn-icon" />}
      </button>
    )
  }

  return (
    <button
      type="button"
      className={cn(
        "wl-home-v2-archive-random-btn",
        variant === "tile" && "wl-home-v2-archive-random-btn--tile",
        variant === "subnav" && "wl-home-v2-archive-subnav-random-btn",
      )}
      onClick={() => void handleClick()}
      disabled={loading}
      aria-label="Random Show"
    >
      <span className="wl-home-v2-archive-random-btn__label">Random Show</span>
      {loading ?
        <CircleNotch
          className="wl-home-v2-archive-random-btn__icon wl-home-v2-archive-random-btn__icon--spin"
          size={iconSize}
          weight="bold"
          aria-hidden
        />
      : <RotatingDiceIcon size={iconSize} />}
    </button>
  )
}
