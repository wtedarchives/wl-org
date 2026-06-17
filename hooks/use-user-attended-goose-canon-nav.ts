"use client"

import { useEffect, useMemo, useState } from "react"

import {
  buildAttendedGooseCanonNav,
  fetchUserAttendedGooseCanonShows,
  isAttendedGooseCanonShow,
  type AttendedGooseCanonNav,
  type AttendedGooseCanonShowRow,
} from "@/lib/user-attended-goose-canon-nav"
import type { Show } from "@/types/setlist"

export type UserAttendedGooseCanonNavState = {
  visible: boolean
  nav: AttendedGooseCanonNav | null
  shows: AttendedGooseCanonShowRow[]
  loading: boolean
}

export function useUserAttendedGooseCanonNav(
  userId: string | null | undefined,
  showId: string | undefined,
  show: Show | null,
  attended: boolean,
): UserAttendedGooseCanonNavState {
  const [rows, setRows] = useState<AttendedGooseCanonShowRow[]>([])
  const [loading, setLoading] = useState(false)

  const isEligibleShow = isAttendedGooseCanonShow(show)

  useEffect(() => {
    if (!userId || !attended || !isEligibleShow) {
      setRows([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    void fetchUserAttendedGooseCanonShows(userId)
      .then((nextRows) => {
        if (!cancelled) setRows(nextRows)
      })
      .catch(() => {
        if (!cancelled) setRows([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId, attended, isEligibleShow, showId])

  const nav = useMemo(() => {
    if (!showId || !attended || !isEligibleShow) return null
    return buildAttendedGooseCanonNav(rows, showId)
  }, [attended, isEligibleShow, rows, showId])

  const shows = useMemo(() => {
    if (!attended || !isEligibleShow) return []
    return rows
  }, [attended, isEligibleShow, rows])

  const visible = Boolean(attended && isEligibleShow && nav && !loading)

  return { visible, nav, shows, loading }
}
