"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-context"
import { supabase } from "@/lib/supabase"
import type { SongPerformance } from "@/types/song"

export function usePerformanceData(performances: SongPerformance[]) {
  const { user } = useAuth()
  const [performancesWithGaps, setPerformancesWithGaps] = useState<
    SongPerformance[]
  >([])
  const [attendedShowIds, setAttendedShowIds] = useState<Set<string>>(new Set())
  const [loadingAttended, setLoadingAttended] = useState(false)

  useEffect(() => {
    const sortedPerfs = [...performances].sort((a, b) => {
      const dateA = new Date(a.show_date).getTime()
      const dateB = new Date(b.show_date).getTime()
      if (dateA !== dateB) return dateA - dateB

      const setA = a.entry_set || ""
      const setB = b.entry_set || ""
      const setComparison = setA.localeCompare(setB)
      if (setComparison !== 0) return setComparison

      const setnumA = parseInt(String(a.entry_setnum || "0"), 10)
      const setnumB = parseInt(String(b.entry_setnum || "0"), 10)
      return setnumA - setnumB
    })

    const perfsWithGaps = sortedPerfs.map((perf, index) => {
      let gap: number | string | null = null

      if (
        perf.shows_since_debut_num !== null &&
        perf.shows_since_debut_num !== undefined
      ) {
        if (index === 0) {
          gap = "Debut"
        } else {
          let prevIndex = index - 1
          while (prevIndex >= 0) {
            const prevPerf = sortedPerfs[prevIndex]
            if (
              prevPerf.shows_since_debut_num !== null &&
              prevPerf.shows_since_debut_num !== undefined
            ) {
              gap =
                perf.shows_since_debut_num - prevPerf.shows_since_debut_num
              break
            }
            prevIndex--
          }
          if (gap === null) {
            gap = "Debut"
          }
        }
      }

      return { ...perf, gap }
    })

    setPerformancesWithGaps(perfsWithGaps)
  }, [performances])

  useEffect(() => {
    async function fetchAttendedShows() {
      if (!user || !supabase) {
        setAttendedShowIds(new Set())
        return
      }

      setLoadingAttended(true)
      try {
        const { data, error } = await supabase
          .from("user_attended_shows")
          .select("show_id")
          .eq("user_id", session?.profileId)

        if (error) throw error

        if (data) {
          const showIds = new Set(data.map((record) => record.show_id))
          setAttendedShowIds(showIds)
        }
      } catch (error) {
        console.error("Error fetching attended shows:", error)
      } finally {
        setLoadingAttended(false)
      }
    }

    fetchAttendedShows()
  }, [session?.profileId])

  return {
    performancesWithGaps,
    attendedShowIds,
    loadingAttended,
  }
}
