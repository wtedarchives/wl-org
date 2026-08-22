"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/** Same-origin LunaRadio markup under `public/radio-player/`. Kept for revert. */
const RADIO_EMBED_PATH = "/radio-player/player-markup.html"
const MAX_EMBED_LOAD_ATTEMPTS = 3
const EMBED_LOAD_TIMEOUT_MS = 15_000

function radioEmbedSrc() {
  return `${RADIO_EMBED_PATH}?_=${Date.now()}`
}

export function RadioEmbed({
  className = "",
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  const [src, setSrc] = useState(radioEmbedSrc)
  const attemptRef = useRef(0)
  const loadedRef = useRef(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleLoadTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      if (loadedRef.current) return
      if (attemptRef.current >= MAX_EMBED_LOAD_ATTEMPTS - 1) return
      attemptRef.current += 1
      setSrc(radioEmbedSrc())
    }, EMBED_LOAD_TIMEOUT_MS)
  }, [])

  useEffect(() => {
    loadedRef.current = false
    scheduleLoadTimeout()
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [src, scheduleLoadTimeout])

  const onLoad = useCallback(() => {
    loadedRef.current = true
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const onError = useCallback(() => {
    if (loadedRef.current) return
    if (attemptRef.current >= MAX_EMBED_LOAD_ATTEMPTS - 1) return
    attemptRef.current += 1
    setSrc(radioEmbedSrc())
  }, [])

  return (
    <iframe
      key={src}
      src={src}
      title="WTED Radio"
      className={`w-full rounded-md border-0 ${className}`}
      style={{ height: "76px", ...style }}
      onLoad={onLoad}
      onError={onError}
    />
  )
}
