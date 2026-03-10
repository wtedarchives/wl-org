"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { PlayerStats, SortField, SortDirection } from "@/components/dpro/setlistgame/standings-types"
import { sortStandings } from "@/components/dpro/setlistgame/standings-utils"

const correctSetResults = [
  "correct_song_set",
  "correct_song_set_setnum",
  "correct_song_set_openercloserencore",
  "correct_song_set_setnum_openercloserencore",
]

export function useStandingsData(
  activeLeague: string,
  sortField: SortField,
  sortDirection: SortDirection
): { standings: PlayerStats[]; loading: boolean } {
  const [standings, setStandings] = useState<PlayerStats[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStandings = useCallback(async () => {
    if (!supabase) return

    try {
      setLoading(true)

      const { data: showData, error: showError } = await supabase
        .from("shows")
        .select("show_id")
        .eq("show_tour", activeLeague)
        .eq("show_scored", true)
        .eq("show_issetlistgame", true)

      if (showError || !showData || showData.length === 0) {
        setStandings([])
        setLoading(false)
        return
      }

      const showIds = showData.map((s) => s.show_id)

      const { data: submissionsData, error: submissionsError } = await supabase
        .from("setlist_game_submissions")
        .select(
          "submission_id, user_id, show_id, score, total_songs_picked, total_songs_played"
        )
        .in("show_id", showIds)

      if (submissionsError || !submissionsData || submissionsData.length === 0) {
        setStandings([])
        setLoading(false)
        return
      }

      const userIds = [...new Set(submissionsData.map((s) => s.user_id))]

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds)

      const usernameMap =
        profilesData?.reduce(
          (acc, p) => {
            acc[p.id] = p.username
            return acc
          },
          {} as Record<string, string>
        ) ?? {}

      const submissionIds = submissionsData.map((s) => s.submission_id)

      const { data: picksData } = await supabase
        .from("setlist_game_picks")
        .select(
          "submission_id, result, set, placement, showopener_correct, showcloser_correct"
        )
        .in("submission_id", submissionIds)
        .neq("result", "not_played")

      const userStats: Record<string, PlayerStats> = {}

      submissionsData.forEach((sub) => {
        const userId = sub.user_id
        const username = (usernameMap[userId] ?? userId.substring(0, 8)).split(
          "@"
        )[0]

        if (!userStats[userId]) {
          userStats[userId] = {
            username,
            userId,
            totalPoints: 0,
            showsPlayed: 0,
            avgPointsPerShow: 0,
            songsPicked: 0,
            setsPicked: 0,
            showOpenersPicked: 0,
            showClosersPicked: 0,
          }
        }
        userStats[userId].totalPoints += sub.score ?? 0
        userStats[userId].showsPlayed += 1
      })

      picksData?.forEach((pick) => {
        const sub = submissionsData.find((s) => s.submission_id === pick.submission_id)
        if (!sub) return
        const userId = sub.user_id

        if (pick.result !== "not_played") userStats[userId].songsPicked += 1
        if (correctSetResults.includes(pick.result ?? "")) {
          userStats[userId].setsPicked += 1
        }
        if (pick.showopener_correct) userStats[userId].showOpenersPicked += 1
        if (pick.showcloser_correct) userStats[userId].showClosersPicked += 1
      })

      const standingsArray = Object.values(userStats).map((u) => ({
        ...u,
        avgPointsPerShow: Number(
          (u.totalPoints / (u.showsPlayed || 1)).toFixed(2)
        ),
      }))

      setStandings(sortStandings(standingsArray, sortField, sortDirection))
    } catch (error) {
      console.error("Error fetching standings:", error)
      setStandings([])
    } finally {
      setLoading(false)
    }
  }, [activeLeague, sortField, sortDirection])

  useEffect(() => {
    fetchStandings()
  }, [fetchStandings])

  return { standings, loading }
}
