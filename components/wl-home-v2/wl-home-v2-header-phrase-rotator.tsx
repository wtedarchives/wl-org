"use client"

import { useEffect, useState } from "react"

import {
  pickNextWlHomeTickerPhrase,
  WL_HOME_V2_TICKER_RANDOM_PHRASES,
} from "./wl-home-v2-constants"

const PHRASE_ROTATE_MS = 8_000
const PHRASE_DISSOLVE_MS = 400

export function WlHomeV2HeaderPhraseRotator() {
  const [phrase, setPhrase] = useState(
    () => WL_HOME_V2_TICKER_RANDOM_PHRASES[0] ?? "",
  )
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") return

    const reducedMotionMq = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    )
    let dissolveTimeoutId: number | undefined

    const rotatePhrase = () => {
      if (reducedMotionMq.matches) {
        setPhrase((prev) => pickNextWlHomeTickerPhrase(prev))
        return
      }

      setVisible(false)
      dissolveTimeoutId = window.setTimeout(() => {
        setPhrase((prev) => pickNextWlHomeTickerPhrase(prev))
        setVisible(true)
      }, PHRASE_DISSOLVE_MS)
    }

    const intervalId = window.setInterval(rotatePhrase, PHRASE_ROTATE_MS)
    return () => {
      window.clearInterval(intervalId)
      if (dissolveTimeoutId !== undefined) {
        window.clearTimeout(dissolveTimeoutId)
      }
    }
  }, [])

  return (
    <p
      className={[
        "top-header-controls-phrase",
        visible ? "" : "top-header-controls-phrase--hiding",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-live="polite"
    >
      {phrase}
    </p>
  )
}
