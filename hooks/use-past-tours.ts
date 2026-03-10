"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export interface TourStats {
  tour: string
  tour_id: string
  playerCount: number
  showCount: number
  winners: Array<{ username: string; score: number }>
  canonId?: number
}

export function usePastTours(currentLeague: string): {
  loading: boolean
  pastTours: TourStats[]
} {
  const [loading, setLoading] = useState(true)
  const [pastTours, setPastTours] = useState<TourStats[]>([])

  useEffect(() => {
    async function fetchPastTours() {
      if (!supabase) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        const { data: toursData, error: toursError } = await supabase
          .from("tours")
          .select("tour, tour_id, tour_canonid")
          .neq("tour", currentLeague)

        if (toursError || !toursData || toursData.length === 0) {
          setLoading(false)
          return
        }

        const tourMap = new Map<
          string,
          {
            userIds: Set<string>
            showIds: Set<string>
            userScores: Map<string, number>
            canonId?: number
            tourId: string
          }
        >()

        toursData.forEach((t) => {
          tourMap.set(t.tour, {
            userIds: new Set(),
            showIds: new Set(),
            userScores: new Map(),
            canonId: t.tour_canonid,
            tourId: t.tour_id,
          })
        })

        const { data: showsData, error: showsError } = await supabase
          .from("shows")
          .select("show_id, show_tour")
          .in("show_tour", toursData.map((t) => t.tour))
          .eq("show_issetlistgame", true)
          .eq("show_scored", true)

        if (showsError || !showsData || showsData.length === 0) {
          setLoading(false)
          return
        }

        const showIds = showsData.map((s) => s.show_id)

        const { data: submissionsData, error: submissionsError } =
          await supabase
            .from("setlist_game_submissions")
            .select("submission_id, user_id, show_id, score")
            .in("show_id", showIds)
            .not("score", "is", null)

        if (submissionsError || !submissionsData || submissionsData.length === 0) {
          setLoading(false)
          return
        }

        const showToTourMap = new Map(
          showsData.map((s) => [s.show_id, s.show_tour])
        )

        submissionsData.forEach((sub) => {
          const tour = showToTourMap.get(sub.show_id)
          if (!tour || tour === currentLeague) return

          const tourData = tourMap.get(tour)
          if (!tourData) return

          tourData.userIds.add(sub.user_id)
          tourData.showIds.add(sub.show_id)
          const current = tourData.userScores.get(sub.user_id) ?? 0
          tourData.userScores.set(sub.user_id, current + (sub.score ?? 0))
        })

        const userIds = [...new Set(submissionsData.map((s) => s.user_id))]

        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", userIds)

        const usernameMap = new Map(
          profiles?.map((p) => [p.id, p.username]) ?? []
        )

        const tourStats: TourStats[] = []

        tourMap.forEach((data, tour) => {
          if (data.showIds.size === 0) return

          let maxScore = -Infinity
          const winners: Array<{ username: string; score: number }> = []

          data.userScores.forEach((score, userId) => {
            const username = usernameMap.get(userId) ?? "Unknown"
            if (score > maxScore) {
              maxScore = score
              winners.length = 0
              winners.push({ username, score })
            } else if (score === maxScore) {
              winners.push({ username, score })
            }
          })

          tourStats.push({
            tour,
            tour_id: data.tourId,
            playerCount: data.userIds.size,
            showCount: data.showIds.size,
            winners,
            canonId: data.canonId,
          })
        })

        tourStats.sort((a, b) => {
          if (a.canonId != null && b.canonId != null) {
            return b.canonId - a.canonId
          }
          return b.tour.localeCompare(a.tour)
        })

        setPastTours(tourStats)
      } catch (error) {
        console.error("Error in fetchPastTours:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPastTours()
  }, [currentLeague])

  return { loading, pastTours }
}
