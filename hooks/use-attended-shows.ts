"use client"

import { useState, useEffect } from "react"
import { fetchAttendedShows, type AttendedShow } from "@/lib/utils/fetch-attended-shows"

export function useAttendedShows(userId: string | null, refetchKey?: number) {
  const [attendedShows, setAttendedShows] = useState<AttendedShow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const shows = await fetchAttendedShows(userId!, (p) => {
          if (!cancelled) setLoadingProgress(p)
        })
        if (!cancelled) {
          setAttendedShows(shows)
        }
      } catch (err) {
        console.error("Error fetching attended shows:", err)
        if (!cancelled) setAttendedShows([])
      } finally {
        if (!cancelled) {
          setLoadingProgress(100)
          setTimeout(() => setLoading(false), 300)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [userId, refetchKey])

  return { attendedShows, loading, loadingProgress }
}
