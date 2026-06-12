"use client"

import { useEffect, useState } from "react"

import {
  fetchWtedRecentlyPlayedTracks,
  type WtedRecentlyPlayedTrack,
} from "@/lib/wted-recently-played"
import { WTED_RADIO_STATUS_POLL_MS } from "@/lib/wted-radio-co-status"
import { preloadImageUrls } from "@/lib/preload-image-urls"

export function useWtedRecentlyPlayedTracks(enabled: boolean) {
  const [tracks, setTracks] = useState<WtedRecentlyPlayedTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function load(isInitialLoad: boolean) {
      if (isInitialLoad) setLoading(true)
      try {
        const next = await fetchWtedRecentlyPlayedTracks()
        if (cancelled) return
        setTracks(next)
        setError(null)
        void preloadImageUrls(next.map((track) => track.artworkUrl))
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ?
              err.message
            : "Could not load recently played tracks.",
          )
          setTracks([])
        }
      } finally {
        if (!cancelled && isInitialLoad) setLoading(false)
      }
    }

    void load(true)

    const interval = window.setInterval(() => {
      void load(false)
    }, WTED_RADIO_STATUS_POLL_MS)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [enabled])

  return { tracks, loading, error }
}
