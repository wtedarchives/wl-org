"use client"

import { useEffect, useLayoutEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

function localTomorrowDateString(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** Past + upcoming rows for WL Home Tour Schedule modal (matches old-home ordering; no canon filter). */
export type WlHomeTourScheduleShow = {
  show_id: string
  show_date: string
  show_group: string
  show_venue_location: string
  show_wl_link: string | null
  venue_id?: string | null
  /** Chronological ordering within the unified list */
  segment: "past" | "upcoming"
}

const SHOW_COLUMNS = `
  show_id,
  show_date,
  show_group,
  show_venue_location,
  show_wl_link,
  show_canonid,
  subvenues:show_subvenue(
    venues:subvenue_venue(
      venue_id
    )
  )
` as const

export function useWlHomeTourScheduleShows(enabled: boolean) {
  const [shows, setShows] = useState<WlHomeTourScheduleShow[]>([])
  const [mostRecentPastShowId, setMostRecentPastShowId] = useState<
    string | null
  >(null)
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
      setMostRecentPastShowId(null)
      setLoading(false)
      return
    }
    if (!supabase) {
      setShows([])
      setMostRecentPastShowId(null)
      setLoading(false)
      return
    }

    let cancelled = false
    const client = supabase

    async function run() {
      setLoading(true)
      try {
        const tomorrow = localTomorrowDateString()

        const { data: pastData, error: pastErr } = await client
          .from("shows")
          .select(SHOW_COLUMNS)
          .lt("show_date", tomorrow)
          .order("show_date", { ascending: false })
          .order("show_canonid", { ascending: true, nullsFirst: true })
          .order("show_group", { ascending: true })
          .limit(6)

        if (pastErr) throw pastErr

        const { data: upcomingData, error: upErr } = await client
          .from("shows")
          .select(SHOW_COLUMNS)
          .gte("show_date", tomorrow)
          .order("show_date", { ascending: true })
          .order("show_canonid", { ascending: true, nullsFirst: true })
          .order("show_group", { ascending: true })
          .limit(5)

        if (upErr) throw upErr

        const mapRows = (
          rows: any[],
          segment: "past" | "upcoming",
        ): WlHomeTourScheduleShow[] =>
          (rows ?? []).map((show) => ({
            show_id: show.show_id as string,
            show_date: show.show_date as string,
            show_group: show.show_group as string,
            show_venue_location: show.show_venue_location as string,
            show_wl_link:
              typeof show.show_wl_link === "string" ?
                show.show_wl_link
              : null,
            venue_id: show.subvenues?.venues?.venue_id ?? null,
            segment,
          }))

        const mr =
          Array.isArray(pastData) && pastData.length > 0 ?
            pastData[0]?.show_id
          : undefined
        const mostRecent =
          typeof mr === "string" && mr.length > 0 ? mr : null

        const pastAsc = [...mapRows(pastData ?? [], "past")].reverse()

        const combined = [...pastAsc, ...mapRows(upcomingData ?? [], "upcoming")]

        if (!cancelled) {
          setMostRecentPastShowId(mostRecent)
          setShows(combined)
        }
      } catch {
        if (!cancelled) {
          setShows([])
          setMostRecentPastShowId(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [enabled, currentDate])

  return { shows, loading, mostRecentPastShowId }
}
