"use client"

import { useEffect, useState } from "react"

import type { RadioScheduleSlot } from "@/hooks/use-radio-schedule"
import {
  resolveScheduleShareExportAssets,
  type ScheduleShareResolvedAssets,
} from "@/lib/wl-schedule-share-resolve-assets"

export function useScheduleShareResolvedAssets({
  enabled,
  backgroundSrc,
  slots,
  scheduleLoading,
}: {
  enabled: boolean
  backgroundSrc: string
  slots: RadioScheduleSlot[]
  scheduleLoading: boolean
}) {
  const [assets, setAssets] = useState<ScheduleShareResolvedAssets | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || scheduleLoading) {
      setAssets(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    resolveScheduleShareExportAssets(backgroundSrc, slots)
      .then((resolved) => {
        if (cancelled) return
        setAssets(resolved)
        setLoading(false)
      })
      .catch((e) => {
        console.error(e)
        if (cancelled) return
        setAssets(null)
        setError("Could not load images for the schedule export.")
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [enabled, scheduleLoading, backgroundSrc, slots])

  return { assets, loading, error }
}
