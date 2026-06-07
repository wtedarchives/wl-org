"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { isRecordingSessionShow } from "@/lib/show-recording-session-filter"

export interface ShowByYear {
  year: string
  gooseCount: number
  otherCount: number
}

const PAGE_SIZE = 1000
const CHUNK_SIZE = 500

export function useOverviewChartData(userId: string | null) {
  const [data, setData] = useState<ShowByYear[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const client = supabase
    if (!client) {
      setLoading(false)
      return
    }

    async function fetchData() {
      const sb = supabase
      if (!sb) return
      try {
        setLoading(true)

        const allAttendedShows: { show_id: string }[] = []
        let page = 0
        let hasMore = true

        while (hasMore) {
          const { data: attendedData, error } = await sb
            .from("user_attended_shows")
            .select("show_id")
            .eq("user_id", userId)
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

          if (error) throw error
          if (attendedData && attendedData.length > 0) {
            allAttendedShows.push(...attendedData)
            page++
            hasMore = attendedData.length === PAGE_SIZE
          } else {
            hasMore = false
          }
        }

        if (allAttendedShows.length === 0) {
          setData([])
          setLoading(false)
          return
        }

        const showIds = allAttendedShows.map((s) => s.show_id)
        const showIdChunks: string[][] = []
        for (let i = 0; i < showIds.length; i += CHUNK_SIZE) {
          showIdChunks.push(showIds.slice(i, i + CHUNK_SIZE))
        }

        const allShowDetails: {
          show_date?: string
          show_group?: string
          show_detail?: string | null
        }[] = []

        for (const chunk of showIdChunks) {
          let chunkPage = 0
          let chunkHasMore = true
          while (chunkHasMore) {
            const { data: showData, error } = await sb
              .from("shows")
              .select("show_date, show_group, show_detail")
              .in("show_id", chunk)
              .range(chunkPage * PAGE_SIZE, (chunkPage + 1) * PAGE_SIZE - 1)

            if (error) throw error
            if (showData && showData.length > 0) {
              allShowDetails.push(...showData)
              chunkPage++
              chunkHasMore = showData.length === PAGE_SIZE
            } else {
              chunkHasMore = false
            }
          }
        }

        const yearData: Record<
          string,
          { gooseCount: number; otherCount: number }
        > = {}

        allShowDetails.forEach((show) => {
          if (!show.show_date || isRecordingSessionShow(show)) return
          const year = new Date(show.show_date).getFullYear().toString()
          if (!yearData[year]) {
            yearData[year] = { gooseCount: 0, otherCount: 0 }
          }
          if (show.show_group === "Goose") {
            yearData[year].gooseCount += 1
          } else {
            yearData[year].otherCount += 1
          }
        })

        let chartData = Object.entries(yearData)
          .map(([year, counts]) => ({
            year,
            gooseCount: counts.gooseCount,
            otherCount: counts.otherCount,
          }))
          .sort((a, b) => parseInt(a.year, 10) - parseInt(b.year, 10))

        if (chartData.length > 0) {
          const firstYear = parseInt(chartData[0].year, 10)
          const lastYear = parseInt(chartData[chartData.length - 1].year, 10)
          const completeData: ShowByYear[] = []
          for (let y = firstYear; y <= lastYear; y++) {
            const existing = chartData.find((d) => parseInt(d.year, 10) === y)
            completeData.push(
              existing ?? {
                year: y.toString(),
                gooseCount: 0,
                otherCount: 0,
              }
            )
          }
          chartData = completeData
        }

        setData(chartData)
      } catch (err) {
        console.error("Error fetching overview chart data:", err)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId])

  return { data, loading }
}
