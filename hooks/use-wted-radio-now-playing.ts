"use client"

import { useEffect, useState } from "react"

import {
  WTED_RADIO_STATUS_POLL_MS,
  WTED_RADIO_STATUS_URL,
  getWtedNowPlayingTitle,
  type RadioCoStatusResponse,
} from "@/lib/wted-radio-co-status"

export function useWtedRadioNowPlaying() {
  const [title, setTitle] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(WTED_RADIO_STATUS_URL)
        if (!res.ok) throw new Error(String(res.status))
        const data = (await res.json()) as RadioCoStatusResponse
        if (cancelled) return
        setTitle(getWtedNowPlayingTitle(data))
      } catch {
        if (!cancelled) setTitle(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    const id = window.setInterval(() => void load(), WTED_RADIO_STATUS_POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  return { title, loading }
}
