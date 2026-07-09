"use client"

import { useQuery } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { fetchSetlistCore } from "@/lib/archive/fetch-setlist-core"
import { archiveQueryKeys } from "@/lib/archive-query-keys"
import type { Show, SetlistEntry, ShowDate } from "@/types/setlist"

function formatShowDateUtc(dateString: string): string {
  const date = new Date(dateString + "T00:00:00Z")
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0")
  const day = date.getUTCDate().toString().padStart(2, "0")
  const year = date.getUTCFullYear().toString().slice(-2)
  return `${month}.${day}.${year}`
}

export interface Tour {
  tour: string
  tour_canonid: number
  tour_id: string
}

export function useSetlistData(showId: string | undefined) {
  const [showLengthRank, setShowLengthRank] = useState<number | null>(null)

  const {
    data,
    isLoading: queryLoading,
    isFetching,
  } = useQuery({
    queryKey: archiveQueryKeys.setlistCore(showId ?? ""),
    queryFn: () => fetchSetlistCore(showId!),
    enabled: Boolean(showId && supabase),
  })

  const show = data?.show ?? null
  const setlist = data?.setlist ?? []
  const loading = Boolean(showId && supabase && queryLoading)

  useEffect(() => {
    setShowLengthRank(null)
  }, [showId])

  useEffect(() => {
    if (!showId || !show?.show_canonid || !supabase) return
    const client = supabase

    async function fetchShowLengthRank() {
      try {
        const { data: showsData, error } = await client
          .from("shows")
          .select("show_id, show_length")
          .not("show_canonid", "is", null)
          .not("show_length", "is", null)

        if (error) throw error

        const timeToSeconds = (timeStr: string) => {
          const parts = timeStr.split(":").map(Number)
          if (parts.length === 3)
            return parts[0] * 3600 + parts[1] * 60 + parts[2]
          if (parts.length === 2) return parts[0] * 60 + parts[1]
          return 0
        }

        const showsWithSeconds = (showsData ?? [])
          .map((s: { show_id: string; show_length: string }) => ({
            show_id: s.show_id,
            total_seconds: timeToSeconds(s.show_length),
          }))
          .sort(
            (a: { total_seconds: number }, b: { total_seconds: number }) =>
              b.total_seconds - a.total_seconds,
          )

        const rankIndex = showsWithSeconds.findIndex(
          (s: { show_id: string }) => s.show_id === showId,
        )
        if (rankIndex !== -1 && rankIndex < 25) {
          setShowLengthRank(rankIndex + 1)
        } else {
          setShowLengthRank(null)
        }
      } catch (err) {
        console.error("Error fetching show length rank:", err)
        setShowLengthRank(null)
      }
    }

    fetchShowLengthRank()
  }, [showId, show?.show_canonid])

  const progress = loading && isFetching ? 50 : undefined

  return { show, setlist, loading, showLengthRank, progress }
}

export function useTours() {
  const [tours, setTours] = useState<Tour[]>([])

  useEffect(() => {
    if (!supabase) return
    const client = supabase
    async function fetchTours() {
      try {
        const { data, error } = await client
          .from("tours")
          .select("tour, tour_canonid, tour_id")
          .order("tour_canonid", { ascending: true })
        if (error) throw error
        setTours((data as Tour[]) ?? [])
      } catch (err) {
        console.error("Error fetching tours:", err)
      }
    }
    fetchTours()
  }, [])

  return { tours }
}

export function useShowDates(show: Show | null, showId: string | undefined) {
  const [showDates, setShowDates] = useState<ShowDate[]>([])

  useEffect(() => {
    if (!show?.show_tour || !supabase) {
      setShowDates([])
      return
    }
    const client = supabase
    const tourName = show.show_tour

    async function fetchShowDates() {
      setShowDates([])
      try {
        const { data, error } = await client
          .from("shows")
          .select(
            `
            show_id,
            show_date,
            show_group,
            show_subvenue,
            show_detail,
            show_alert,
            show_venue_location,
            show_canonid,
            subvenues (
              subvenue_venue,
              venues (
                venue_location
              )
            )
          `,
          )
          .eq("show_tour", tourName)
          .order("show_date", { ascending: true })

        if (error) throw error

        const sortedShows = (data ?? []).sort(
          (
            a: {
              show_date: string
              show_canonid: number | null
              show_group: string
            },
            b: {
              show_date: string
              show_canonid: number | null
              show_group: string
            },
          ) => {
            const dateA = new Date(a.show_date).getTime()
            const dateB = new Date(b.show_date).getTime()
            if (dateA !== dateB) return dateA - dateB
            const aHasCanonid = a.show_canonid !== null
            const bHasCanonid = b.show_canonid !== null
            if (aHasCanonid && bHasCanonid)
              return a.show_canonid! - b.show_canonid!
            if (aHasCanonid && !bHasCanonid) return -1
            if (!aHasCanonid && bHasCanonid) return 1
            return (a.show_group ?? "").localeCompare(b.show_group ?? "")
          },
        )

        const processed = sortedShows.map(
          (s: {
            show_id: string
            show_date: string
            show_group: string
            show_subvenue: string
            show_venue_location: string | null
            show_detail: string | null
            show_alert: string | null
            show_canonid: number | null
          }) => ({
            show_id: s.show_id,
            show_date: s.show_date,
            formatted_show_date: formatShowDateUtc(s.show_date),
            show_group: s.show_group,
            show_subvenue: s.show_subvenue,
            show_venue_location: s.show_venue_location,
            show_detail: s.show_detail,
            show_alert: s.show_alert,
            show_rarity_percentage: null,
            total_entry_length: null,
            show_canonid: s.show_canonid,
          }),
        )
        setShowDates(processed as ShowDate[])
      } catch (err) {
        console.error("Error fetching show dates:", err)
      }
    }

    fetchShowDates()
  }, [show?.show_tour, showId])

  return { showDates }
}
