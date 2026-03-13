"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { AttendanceStatsData } from "@/types/attendance"

const PAGE_SIZE = 1000
const CHUNK_SIZE = 200

async function fetchAll<T>(
  table: string,
  select: string,
  filter: { column: string; value: string },
  pageSize = PAGE_SIZE
): Promise<T[]> {
  const client = supabase
  if (!client) return []

  const all: T[] = []
  let page = 0
  let hasMore = true

  while (hasMore) {
    const { data, error } = await client
      .from(table)
      .select(select)
      .eq(filter.column, filter.value)
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) throw error
    if (data && data.length > 0) {
      all.push(...(data as T[]))
      page++
      hasMore = data.length === pageSize
    } else {
      hasMore = false
    }
  }
  return all
}

async function fetchInChunks<T>(
  table: string,
  select: string,
  ids: string[],
  idColumn: string,
  pageSize = PAGE_SIZE
): Promise<T[]> {
  const client = supabase
  if (!client) return []

  const chunks: string[][] = []
  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    chunks.push(ids.slice(i, i + CHUNK_SIZE))
  }

  const all: T[] = []
  for (const chunk of chunks) {
    let page = 0
    let hasMore = true
    while (hasMore) {
      const { data, error } = await client
        .from(table)
        .select(select)
        .in(idColumn, chunk)
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (error) throw error
      if (data && data.length > 0) {
        all.push(...(data as T[]))
        page++
        hasMore = data.length === pageSize
      } else {
        hasMore = false
      }
    }
  }
  return all
}

export function useAttendanceStats(userId: string | null) {
  const [data, setData] = useState<AttendanceStatsData>({
    showsCount: 0,
    venuesCount: 0,
    songsCount: 0,
    tourCounts: [],
  })
  const [loading, setLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)

  useEffect(() => {
    const uid = userId
    if (!uid) {
      setLoadingProgress(100)
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchStats() {
      try {
        setLoading(true)
        setLoadingProgress(5)

        const allAttended = await fetchAll<{ show_id: string }>(
          "user_attended_shows",
          "show_id",
          { column: "user_id", value: uid as string }
        )

        setLoadingProgress(22)

        if (!allAttended.length) {
          if (!cancelled) {
            setData({
              showsCount: 0,
              venuesCount: 0,
              songsCount: 0,
              tourCounts: [],
            })
            setLoadingProgress(100)
            setTimeout(() => setLoading(false), 300)
          }
          return
        }

        const showIds = allAttended.map((r) => r.show_id)
        setLoadingProgress(25)

        const showDetails = await fetchInChunks<{
          show_id: string
          show_group: string
          show_canonid: string | null
        }>(
          "shows",
          "show_id, show_group, show_canonid",
          showIds,
          "show_id"
        )

        const filteredShows = showDetails.filter(
          (s) => s.show_group === "Goose" && s.show_canonid
        )
        const filteredIds = filteredShows.map((s) => s.show_id)
        setLoadingProgress(35)

        const venueData = await fetchInChunks<{
          show_subvenue_venue?: string | null
        }>(
          "shows",
          "show_id, show_subvenue_venue",
          filteredIds,
          "show_id"
        )

        const uniqueVenues = new Set<string>()
        venueData.forEach((show) => {
          const v = show.show_subvenue_venue
          if (v) uniqueVenues.add(v)
        })

        setLoadingProgress(65)

        const songData = await fetchInChunks<{ entry_song: string }>(
          "setlist_entries",
          "entry_song",
          filteredIds,
          "entry_show"
        )

        const uniqueSongs = new Set<string>()
        songData.forEach((e) => {
          if (e.entry_song) uniqueSongs.add(e.entry_song)
        })

        setLoadingProgress(90)

        const tourData = await fetchInChunks<{
          show_tour: string | null
          tours: {
            tour: string
            tour_canonid: number
            tour_id: string
          } | null
        }>(
          "shows",
          "show_id, show_tour, tours(tour, tour_canonid, tour_id)",
          filteredIds,
          "show_id"
        )

        const tourCountMap: Record<
          string,
          { count: number; tour: string; tour_canonid: number; tour_id: string }
        > = {}

        tourData.forEach((show) => {
          if (show.show_tour && show.tours) {
            const t = show.tours
            if (!tourCountMap[t.tour]) {
              tourCountMap[t.tour] = {
                count: 0,
                tour: t.tour,
                tour_canonid: t.tour_canonid ?? 0,
                tour_id: t.tour_id,
              }
            }
            tourCountMap[t.tour].count += 1
          }
        })

        const sortedTours = Object.values(tourCountMap).sort(
          (a, b) => a.tour_canonid - b.tour_canonid
        )

        if (!cancelled) {
          setData({
            showsCount: filteredIds.length,
            venuesCount: uniqueVenues.size,
            songsCount: uniqueSongs.size,
            tourCounts: sortedTours,
          })
          setLoadingProgress(100)
          setTimeout(() => setLoading(false), 300)
        }
      } catch (err) {
        console.error("Error fetching attendance stats:", err)
        if (!cancelled) {
          setLoadingProgress(100)
          setTimeout(() => setLoading(false), 300)
        }
      }
    }

    fetchStats()
    return () => {
      cancelled = true
    }
  }, [userId])

  return { data, loading, loadingProgress }
}
