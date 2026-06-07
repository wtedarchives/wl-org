"use client"

import { useEffect, useLayoutEffect, useState } from "react"

import { isRecordingSessionShowDetail } from "@/lib/show-recording-session-filter"
import { supabase } from "@/lib/supabase"

/** YYYY-MM-DD in the user's local timezone (matches old home “This Day in Goose History”). */
function localCalendarDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** Same semantics as `useShowsData` historical (“This Day in Goose History”) list; no attendance join. */
export type WlHomeThisDayInHistoryShow = {
  show_id: string
  show_date: string
  show_group: string
  show_venue_location: string
  show_wl_link: string | null
  venue_id?: string | null
}

const PAGE_SIZE = 1000

const HIST_COLUMNS = `
  show_id,
  show_date,
  show_group,
  show_venue_location,
  show_wl_link,
  show_canonid,
  show_detail,
  subvenues:show_subvenue(
    venues:subvenue_venue(
      venue_id
    )
  )
` as const

export function useWlHomeThisDayInHistoryShows(enabled: boolean) {
  const [shows, setShows] = useState<WlHomeThisDayInHistoryShow[]>([])
  const [loading, setLoading] = useState(false)
  const [currentDate, setCurrentDate] = useState(() => new Date().toDateString())

  useEffect(() => {
    const updateDate = () => {
      const today = new Date().toDateString()
      setCurrentDate((prev) => (today !== prev ? today : prev))
    }
    updateDate()
    const interval = setInterval(updateDate, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  useLayoutEffect(() => {
    if (enabled && supabase && shows.length === 0) {
      setLoading(true)
    }
  }, [enabled, shows.length])

  useEffect(() => {
    if (!enabled) {
      setShows([])
      setLoading(false)
      return
    }
    if (!supabase) {
      setShows([])
      setLoading(false)
      return
    }

    let cancelled = false
    const client = supabase

    async function run() {
      setLoading(true)
      try {
        const todayStr = localCalendarDateString(new Date())
        const month = todayStr.slice(5, 7)
        const day = todayStr.slice(8, 10)
        const startDate = `1900-${month}-${day}`
        const endDate = `2099-${month}-${day}`

        let page = 0
        let hasMore = true
        const allRows: {
          show_id: string
          show_date: string
          show_group: string
          show_venue_location: string
          show_wl_link: string | null
          venue_id?: string | null
        }[] = []

        while (hasMore) {
          const { data, error } = await client
            .from("shows")
            .select(HIST_COLUMNS)
            .gte("show_date", startDate)
            .lte("show_date", endDate)
            .order("show_date", { ascending: false })
            .order("show_canonid", { ascending: true, nullsFirst: true })
            .order("show_group", { ascending: true })
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

          if (error) throw error
          const rows = (data ?? []) as any[]

          if (rows.length > 0) {
            allRows.push(
              ...rows
                .filter(
                  (show) =>
                    !isRecordingSessionShowDetail(
                      show.show_detail as string | null | undefined,
                    ),
                )
                .map((show) => ({
                  show_id: show.show_id as string,
                  show_date: show.show_date as string,
                  show_group: show.show_group as string,
                  show_venue_location: show.show_venue_location as string,
                  show_wl_link:
                    typeof show.show_wl_link === "string" ?
                      show.show_wl_link
                    : null,
                  venue_id: show.subvenues?.venues?.venue_id ?? null,
                })),
            )
            page += 1
            hasMore = rows.length === PAGE_SIZE
          } else {
            hasMore = false
          }
        }

        const filtered = allRows.filter((show) => {
          const showDate = new Date(show.show_date + "T00:00:00")
          const showMonth = String(showDate.getMonth() + 1).padStart(2, "0")
          const showDay = String(showDate.getDate()).padStart(2, "0")
          return showMonth === month && showDay === day
        })

        /** Oldest-first to match legacy `historicalShows` display order after `.reverse()`. */
        filtered.reverse()

        if (!cancelled) setShows(filtered)
      } catch {
        if (!cancelled) setShows([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [enabled, currentDate])

  return { shows, loading }
}
