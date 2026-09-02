import { useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"
import { excludeRecordingSessionShows } from "@/lib/show-recording-session-filter"
import { useAuth } from "@/components/auth-context"

export interface YearShow {
  show_iscanon: boolean
  show_tour: string
  show_id: string
  show_date: string
  show_group: string
  show_subvenue: string
  show_detail: string | null
  show_alert: string | null
  show_canonid: number | null
  venue_location: string | null
  show_venue_location: string
  show_subvenue_venue: string
  venue_id?: string
  attended?: boolean
  show_wl_link?: string | null
  show_issetlistgame?: boolean
}

interface ShowResponse {
  show_iscanon: boolean
  show_tour: string
  show_id: string
  show_date: string
  show_group: string
  show_subvenue: string
  show_detail: string | null
  show_alert: string | null
  show_canonid: number | null
  show_subvenue_venue: string
  show_venue_location: string
  show_wl_link?: string | null
  show_issetlistgame?: boolean
  subvenues?: {
    venues?: {
      venue_id: string
    }
  }
}

export function useShowsDataByYear(currentYear: string) {
  const { session } = useAuth()
  const [shows, setShows] = useState<YearShow[]>([])
  const [loading, setLoading] = useState(true)
  const [attendedShowIds, setAttendedShowIds] = useState<string[]>([])

  useEffect(() => {
    if (!supabase || !session) {
      setAttendedShowIds([])
      return
    }

    const client = supabase
    const userId = session?.profileId
    async function fetchAttendedShows() {
      try {
        const { data, error } = await client
          .from("user_attended_shows")
          .select("show_id")
          .eq("user_id", userId)

        if (error) throw error

        setAttendedShowIds((data ?? []).map((item) => item.show_id))
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching attended shows:", err)
        setAttendedShowIds([])
      }
    }

    fetchAttendedShows()
  }, [session?.profileId])

  useEffect(() => {
    if (!currentYear) return
    if (!supabase) {
      setShows([])
      setLoading(false)
      return
    }

    const client = supabase
    async function fetchShows() {
      try {
        const { data, error } = await client
          .from("shows")
          .select(
            `
            show_iscanon,
            show_tour,
            show_id,
            show_date,
            show_group,
            show_subvenue,
            show_detail,
            show_alert,
            show_canonid,
            show_subvenue_venue,
            show_venue_location,
            show_wl_link,
            show_issetlistgame,
            subvenues:show_subvenue(
              venues:subvenue_venue(
                venue_id
              )
            )
          `
          )
          .eq("show_year", currentYear)
          .order("show_date", { ascending: true })
          .order("show_canonid", { ascending: true, nullsFirst: true })
          .order("show_group", { ascending: true })

        if (error) throw error

        const rows = excludeRecordingSessionShows((data ?? []) as ShowResponse[])
        const processed =
          rows.map((show) => ({
            ...show,
            venue_id: show.subvenues?.venues?.venue_id,
            attended: attendedShowIds.includes(show.show_id),
            venue_location: show.show_venue_location,
          })) ?? []

        setShows(processed)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching shows by year:", err)
        setShows([])
      } finally {
        setLoading(false)
      }
    }

    setLoading(true)
    fetchShows()
  }, [currentYear, attendedShowIds])

  return { shows, loading }
}

