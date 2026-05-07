"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/components/auth-context"
import { supabase } from "@/lib/supabase"

export interface AttendShow {
  show_id: string
  show_date: string
  show_group: string
  show_subvenue: string
  show_venue_location: string
  show_subvenue_venue: string
  venue_id?: string
  show_alert: string | null
  show_detail: string | null
  show_year: string
  attended: boolean
}

export function useAttendShowData(yearFilter: string) {
  const { user, addAttendedShow, removeAttendedShow } = useAuth()
  const [shows, setShows] = useState<AttendShow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAttendedIds = useCallback(async (): Promise<string[]> => {
    if (!user || !supabase) return []
    const { data, error } = await supabase
      .from("user_attended_shows")
      .select("show_id")
      .eq("user_id", session?.profileId)
    if (error) throw error
    return (data ?? []).map((r) => r.show_id)
  }, [user])

  const fetchShows = useCallback(async () => {
    if (!user || !supabase || !yearFilter) return

    setLoading(true)
    try {
      const attendedIds = await fetchAttendedIds()

      const { data, error } = await supabase
        .from("shows")
        .select(
          `
          show_id,
          show_date,
          show_group,
          show_subvenue,
          show_venue_location,
          show_subvenue_venue,
          show_alert,
          show_detail,
          show_year,
          subvenues:show_subvenue(
            venues:subvenue_venue(
              venue_id
            )
          )
        `
        )
        .eq("show_year", yearFilter)
        .order("show_date", { ascending: false })

      if (error) throw error

      if (data) {
        setShows(
          data.map((s) => {
            const subvenues = (s as { subvenues?: { venues?: { venue_id: string } } })
              .subvenues
            const venue_id = subvenues?.venues?.venue_id
            return {
              show_id: s.show_id,
              show_date: s.show_date,
              show_group: s.show_group,
              show_subvenue: s.show_subvenue,
              show_venue_location: s.show_venue_location,
              show_subvenue_venue: s.show_subvenue_venue,
              show_alert: s.show_alert,
              show_detail: s.show_detail,
              show_year: s.show_year,
              venue_id,
              attended: attendedIds.includes(s.show_id),
            }
          })
        )
      }
    } catch (err) {
      console.error("Error fetching attend show data:", err)
    } finally {
      setLoading(false)
    }
  }, [user, yearFilter, fetchAttendedIds])

  useEffect(() => {
    if (yearFilter) fetchShows()
  }, [yearFilter, fetchShows])

  const handleAttendanceToggle = async (show: AttendShow) => {
    if (!user) return
    try {
      if (show.attended) {
        await removeAttendedShow(show.show_id)
      } else {
        await addAttendedShow(show.show_id)
      }
      setShows((prev) =>
        prev.map((s) =>
          s.show_id === show.show_id ? { ...s, attended: !s.attended } : s
        )
      )
    } catch (err) {
      console.error("Error toggling attendance:", err)
    }
  }

  return { shows, loading, handleAttendanceToggle }
}
