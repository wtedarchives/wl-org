"use client"

import { useEffect, useLayoutEffect, useMemo, useState } from "react"

import { supabase } from "@/lib/supabase"

/** YYYY-MM-DD in the user's local timezone. */
function localCalendarDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** Instant for ordering: real show time when present, else local start of `show_date`. */
function sortInstantMs(
  show_date: string,
  show_time: string | null | undefined,
): number {
  if (show_time) {
    const t = Date.parse(show_time)
    if (!Number.isNaN(t)) return t
  }
  const parts = show_date.split("-").map(Number)
  const [y, m, d] = parts
  if (!y || !m || !d) return NaN
  return new Date(y, m - 1, d).getTime()
}

/** Past vs upcoming using device clock; matches calendar-only behavior when `show_time` is missing. */
function segmentForShow(
  show_date: string,
  show_time: string | null | undefined,
  todayLocalStr: string,
  nowMs: number,
): "past" | "upcoming" {
  if (show_time) {
    const t = Date.parse(show_time)
    if (!Number.isNaN(t)) {
      return nowMs >= t ? "past" : "upcoming"
    }
  }
  if (show_date < todayLocalStr) return "past"
  if (show_date > todayLocalStr) return "upcoming"
  const parts = show_date.split("-").map(Number)
  const [y, m, d] = parts
  if (!y || !m || !d) return "upcoming"
  const endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999).getTime()
  return nowMs > endOfDay ? "past" : "upcoming"
}

function compareShowRows(a: RawTourRow, b: RawTourRow): number {
  const ta = sortInstantMs(a.show_date, a.show_time)
  const tb = sortInstantMs(b.show_date, b.show_time)
  if (ta !== tb) return ta - tb
  const dc = a.show_date.localeCompare(b.show_date)
  if (dc !== 0) return dc
  const na = a.show_canonid ?? Number.NEGATIVE_INFINITY
  const nb = b.show_canonid ?? Number.NEGATIVE_INFINITY
  if (na !== nb) return na - nb
  return a.show_group.localeCompare(b.show_group)
}

type RawTourRow = {
  show_id: string
  show_date: string
  show_group: string
  show_tour: string | null
  show_subvenue: string | null
  show_detail: string | null
  show_venue_location: string
  show_wl_link: string | null
  show_canonid: number | null
  show_time: string | null
  subvenues?: { venues?: { venue_id?: string | null } | null } | null
}

/** Past + upcoming rows for WL Home Tour Schedule modal (matches old-home ordering; no canon filter). */
export type WlHomeTourScheduleShow = {
  show_id: string
  show_date: string
  show_group: string
  show_tour: string | null
  show_subvenue: string | null
  show_detail: string | null
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
  show_tour,
  show_subvenue,
  show_detail,
  show_venue_location,
  show_wl_link,
  show_canonid,
  show_time,
  subvenues:show_subvenue(
    venues:subvenue_venue(
      venue_id
    )
  )
` as const

const OVERSAMPLE_PAST = 24
const OVERSAMPLE_UPCOMING = 24
const PAST_DISPLAY = 5
const UPCOMING_DISPLAY = 5

export function useWlHomeTourScheduleShows(enabled: boolean) {
  const [rawRows, setRawRows] = useState<RawTourRow[]>([])
  const [loading, setLoading] = useState(false)
  const [currentDate, setCurrentDate] = useState(() => new Date().toDateString())
  /** Bumps every minute while modal is open so today's/no-time rows move across midnight / doors time. */
  const [nowTick, setNowTick] = useState(0)

  useEffect(() => {
    const updateDate = () => {
      const today = new Date().toDateString()
      setCurrentDate((prev) => (today !== prev ? today : prev))
    }
    updateDate()
    const interval = setInterval(updateDate, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!enabled) return
    const interval = setInterval(() => {
      setNowTick((n) => n + 1)
    }, 60 * 1000)
    return () => clearInterval(interval)
  }, [enabled])

  useLayoutEffect(() => {
    if (enabled && supabase && rawRows.length === 0) {
      setLoading(true)
    }
  }, [enabled, rawRows.length])

  useEffect(() => {
    if (!enabled) {
      setRawRows([])
      setLoading(false)
      return
    }
    if (!supabase) {
      setRawRows([])
      setLoading(false)
      return
    }

    let cancelled = false
    const client = supabase

    async function run() {
      setLoading(true)
      try {
        const todayStr = localCalendarDateString(new Date())

        const { data: recentByCalendar, error: pastErr } = await client
          .from("shows")
          .select(SHOW_COLUMNS)
          .lte("show_date", todayStr)
          .order("show_date", { ascending: false })
          .order("show_canonid", { ascending: true, nullsFirst: true })
          .order("show_group", { ascending: true })
          .limit(OVERSAMPLE_PAST)

        if (pastErr) throw pastErr

        const { data: futureByCalendar, error: upErr } = await client
          .from("shows")
          .select(SHOW_COLUMNS)
          .gte("show_date", todayStr)
          .order("show_date", { ascending: true })
          .order("show_canonid", { ascending: true, nullsFirst: true })
          .order("show_group", { ascending: true })
          .limit(OVERSAMPLE_UPCOMING)

        if (upErr) throw upErr

        const byId = new Map<string, RawTourRow>()
        for (const row of [...(recentByCalendar ?? []), ...(futureByCalendar ?? [])]) {
          const id = row?.show_id as string | undefined
          if (typeof id === "string" && id.length > 0 && !byId.has(id)) {
            byId.set(id, row as RawTourRow)
          }
        }

        if (!cancelled) setRawRows([...byId.values()])
      } catch {
        if (!cancelled) setRawRows([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [enabled, currentDate])

  const { shows, mostRecentPastShowId } = useMemo(() => {
    const nowMs = Date.now()
    const todayStr = localCalendarDateString(new Date())

    const mapped = rawRows.map((show) => ({
      row: show,
      segment: segmentForShow(
        show.show_date,
        show.show_time,
        todayStr,
        nowMs,
      ) as "past" | "upcoming",
      sortKey: sortInstantMs(show.show_date, show.show_time),
    }))

    const pastCandidates = mapped.filter((m) => m.segment === "past")
    pastCandidates.sort((a, b) => {
      if (b.sortKey !== a.sortKey) return b.sortKey - a.sortKey
      return compareShowRows(b.row, a.row)
    })
    const pastPick = pastCandidates.slice(0, PAST_DISPLAY)
    pastPick.sort((a, b) => {
      if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey
      return compareShowRows(a.row, b.row)
    })

    const upcomingCandidates = mapped.filter((m) => m.segment === "upcoming")
    upcomingCandidates.sort((a, b) => {
      if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey
      return compareShowRows(a.row, b.row)
    })
    const upcomingPick = upcomingCandidates.slice(0, UPCOMING_DISPLAY)

    const mostRecentPast =
      pastCandidates.length > 0 ?
        pastCandidates[0]?.row.show_id
      : undefined

    const toWl = (
      row: RawTourRow,
      segment: "past" | "upcoming",
    ): WlHomeTourScheduleShow => ({
      show_id: row.show_id,
      show_date: row.show_date,
      show_group: row.show_group,
      show_tour: typeof row.show_tour === "string" ? row.show_tour : null,
      show_subvenue:
        typeof row.show_subvenue === "string" ? row.show_subvenue : null,
      show_detail: typeof row.show_detail === "string" ? row.show_detail : null,
      show_venue_location: row.show_venue_location,
      show_wl_link:
        typeof row.show_wl_link === "string" ? row.show_wl_link : null,
      venue_id: row.subvenues?.venues?.venue_id ?? null,
      segment,
    })

    return {
      shows: [
        ...pastPick.map((p) => toWl(p.row, "past")),
        ...upcomingPick.map((p) => toWl(p.row, "upcoming")),
      ],
      mostRecentPastShowId:
        typeof mostRecentPast === "string" && mostRecentPast.length > 0 ?
          mostRecentPast
        : null,
    }
  }, [rawRows, nowTick])

  return { shows, loading, mostRecentPastShowId }
}
