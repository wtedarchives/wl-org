"use client"

import { useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth-context"

export interface HomeShow {
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
  formatted_show_date: string
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
  subvenues?: {
    venues?: {
      venue_id: string
    }
  }
}

/** YYYY-MM-DD in the user's local timezone (same basis as "This Day in Goose History"). */
function localCalendarDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** Start of the next local calendar day as YYYY-MM-DD (exclusive upper bound for "past" shows). */
function localTomorrowDateString(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return localCalendarDateString(d)
}

export function useShowsData() {
  const { user } = useAuth()
  const [recentShows, setRecentShows] = useState<HomeShow[]>([])
  const [upcomingShows, setUpcomingShows] = useState<HomeShow[]>([])
  const [historicalShows, setHistoricalShows] = useState<HomeShow[]>([])
  const [mostRecentShow, setMostRecentShow] = useState<HomeShow | null>(null)
  const [setlist, setSetlist] = useState<any[]>([])

  const [loading, setLoading] = useState(true)
  const [loadingUpcoming, setLoadingUpcoming] = useState(true)
  const [loadingHistorical, setLoadingHistorical] = useState(true)
  const [loadingMostRecent, setLoadingMostRecent] = useState(true)
  const [loadingSetlist, setLoadingSetlist] = useState(true)
  const [attendedShowIds, setAttendedShowIds] = useState<string[]>([])

  const [currentDate, setCurrentDate] = useState(() => new Date().toDateString())

  useEffect(() => {
    const updateDate = () => {
      const today = new Date().toDateString()
      if (today !== currentDate) {
        setCurrentDate(today)
      }
    }

    updateDate()
    const interval = setInterval(updateDate, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [currentDate])

  useEffect(() => {
    if (!supabase || !user) {
      setAttendedShowIds([])
      return
    }
    const client = supabase
    const fetchAttendedShows = async () => {
      try {
        const { data, error } = await client
          .from("user_attended_shows")
          .select("show_id")
          .eq("user_id", session?.profileId)
        if (error) throw error
        setAttendedShowIds((data ?? []).map((item) => item.show_id))
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching attended shows:", err)
        setAttendedShowIds([])
      }
    }
    fetchAttendedShows()
  }, [user])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    const client = supabase
    const fetchRecentShows = async () => {
      try {
        const tomorrowString = localTomorrowDateString()

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
            subvenues:show_subvenue(
              venues:subvenue_venue(
                venue_id
              )
            )
          `,
          )
          .lt("show_date", tomorrowString)
          .order("show_date", { ascending: false })
          .order("show_canonid", { ascending: true, nullsFirst: true })
          .order("show_group", { ascending: true })
          .range(1, 5)

        if (error) throw error

        const processed =
          ((data ?? []) as any[]).map((show) => ({
            ...show,
            venue_id: show.subvenues?.venues?.venue_id,
            attended: attendedShowIds.includes(show.show_id),
            venue_location: show.show_venue_location,
            formatted_show_date: new Date(show.show_date + "T00:00:00")
              .toLocaleDateString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "2-digit",
              })
              .replace(/\//g, "."),
          })) ?? []

        setRecentShows(processed.reverse())
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching recent shows:", err)
        setRecentShows([])
      } finally {
        setLoading(false)
      }
    }
    fetchRecentShows()
  }, [attendedShowIds, currentDate])

  useEffect(() => {
    if (!supabase) {
      setLoadingUpcoming(false)
      return
    }
    const client = supabase
    const fetchUpcomingShows = async () => {
      try {
        const tomorrowString = localTomorrowDateString()

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
            subvenues:show_subvenue(
              venues:subvenue_venue(
                venue_id
              )
            )
          `,
          )
          .gte("show_date", tomorrowString)
          .order("show_date", { ascending: true })
          .order("show_canonid", { ascending: true, nullsFirst: true })
          .order("show_group", { ascending: true })
          .limit(5)

        if (error) throw error

        const processed =
          ((data ?? []) as any[]).map((show) => ({
            ...show,
            venue_id: show.subvenues?.venues?.venue_id,
            attended: attendedShowIds.includes(show.show_id),
            venue_location: show.show_venue_location,
            formatted_show_date: new Date(show.show_date + "T00:00:00")
              .toLocaleDateString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "2-digit",
              })
              .replace(/\//g, "."),
          })) ?? []

        setUpcomingShows(processed)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching upcoming shows:", err)
        setUpcomingShows([])
      } finally {
        setLoadingUpcoming(false)
      }
    }
    fetchUpcomingShows()
  }, [attendedShowIds, currentDate])

  useEffect(() => {
    if (!supabase) {
      setLoadingHistorical(false)
      return
    }
    const client = supabase
    const fetchHistoricalShows = async () => {
      try {
        const todayStr = localCalendarDateString(new Date())
        const month = todayStr.slice(5, 7)
        const day = todayStr.slice(8, 10)

        const startDate = `1900-${month}-${day}`
        const endDate = `2099-${month}-${day}`

        const pageSize = 1000
        let page = 0
        let hasMore = true
        let allShowsData: ShowResponse[] = []

        while (hasMore) {
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
              subvenues:show_subvenue(
                venues:subvenue_venue(
                  venue_id
                )
              )
            `,
            )
            .gte("show_date", startDate)
            .lte("show_date", endDate)
            .order("show_date", { ascending: false })
            .order("show_canonid", { ascending: true, nullsFirst: true })
            .order("show_group", { ascending: true })
            .range(page * pageSize, (page + 1) * pageSize - 1)

          if (error) throw error

          const rows = (data ?? []) as any[]

          if (rows.length > 0) {
            allShowsData = allShowsData.concat(rows as unknown as ShowResponse[])
            page += 1
            hasMore = data.length === pageSize
          } else {
            hasMore = false
          }
        }

        const filtered = allShowsData.filter((show) => {
          const showDate = new Date(show.show_date + "T00:00:00")
          const showMonth = String(showDate.getMonth() + 1).padStart(2, "0")
          const showDay = String(showDate.getDate()).padStart(2, "0")
          return showMonth === month && showDay === day
        })

        const processed =
          (filtered ?? []).map((show: any) => ({
            ...show,
            venue_id: show.subvenues?.venues?.venue_id,
            attended: attendedShowIds.includes(show.show_id),
            venue_location: show.show_venue_location,
            formatted_show_date: new Date(show.show_date + "T00:00:00")
              .toLocaleDateString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "2-digit",
              })
              .replace(/\//g, "."),
          })) ?? []

        setHistoricalShows(processed.reverse())
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching historical shows:", err)
        setHistoricalShows([])
      } finally {
        setLoadingHistorical(false)
      }
    }
    fetchHistoricalShows()
  }, [attendedShowIds, currentDate])

  useEffect(() => {
    if (!supabase) {
      setLoadingMostRecent(false)
      return
    }
    const client = supabase
    const fetchMostRecentShow = async () => {
      try {
        const tomorrowString = localTomorrowDateString()

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
            subvenues:show_subvenue(
              venues:subvenue_venue(
                venue_id
              )
            )
          `,
          )
          .lt("show_date", tomorrowString)
          .order("show_date", { ascending: false })
          .order("show_canonid", { ascending: true, nullsFirst: true })
          .order("show_group", { ascending: true })
          .limit(1)
          .maybeSingle()

        if (error) throw error

        const processed =
          data != null
            ? (() => {
                const row: any = data
                return {
                  ...row,
                  venue_id: row.subvenues?.venues?.venue_id,
                  attended: attendedShowIds.includes(row.show_id),
                  venue_location: row.show_venue_location,
                  formatted_show_date: new Date(
                    row.show_date + "T00:00:00",
                  )
                    .toLocaleDateString("en-US", {
                      month: "2-digit",
                      day: "2-digit",
                      year: "2-digit",
                    })
                    .replace(/\//g, "."),
                }
              })()
            : null

        setMostRecentShow(processed)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching most recent show:", err)
        setMostRecentShow(null)
      } finally {
        setLoadingMostRecent(false)
      }
    }
    fetchMostRecentShow()
  }, [attendedShowIds, currentDate])

  useEffect(() => {
    if (!supabase) {
      setSetlist([])
      setLoadingSetlist(false)
      return
    }
    if (!mostRecentShow) {
      setSetlist([])
      setLoadingSetlist(false)
      return
    }
    const client = supabase
    const fetchSetlist = async () => {
      try {
        const { data, error } = await client
          .from("setlist_entries")
          .select(
            `
            entry_song,
            entry_short,
            entry_segue,
            entry_placement,
            entry_setorder,
            entry_set,
            entry_setnum,
            songs:entry_song(
              song_id,
              song,
              song_displayname
            )
          `,
          )
          .eq("entry_show", mostRecentShow.show_id)
          .order("entry_set", { ascending: true })
          .order("entry_setnum", { ascending: true })

        if (error) throw error
        setSetlist(data || [])
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching setlist:", err)
        setSetlist([])
      } finally {
        setLoadingSetlist(false)
      }
    }
    fetchSetlist()
  }, [mostRecentShow])

  return {
    recentShows,
    upcomingShows,
    historicalShows,
    mostRecentShow,
    setlist,
    loading,
    loadingUpcoming,
    loadingHistorical,
    loadingMostRecent,
    loadingSetlist,
  }
}

