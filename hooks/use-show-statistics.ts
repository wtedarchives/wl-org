"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { GameShow } from "./use-game-shows"

export function useShowStatistics(activeLeague: string): {
  showStatsLoading: boolean
  showsWithStats: GameShow[]
} {
  const [showStatsLoading, setShowStatsLoading] = useState(false)
  const [showsWithStats, setShowsWithStats] = useState<GameShow[]>([])

  const fetchShowStatistics = useCallback(async () => {
    if (!activeLeague || !supabase) return

    try {
      setShowStatsLoading(true)

      const { data, error } = await supabase
        .from("shows")
        .select(
          "show_id, show_date, show_subvenue, show_venue_location, show_time, show_tour, show_scored, show_detail, show_canonid, show_subvenue_venue"
        )
        .eq("show_tour", activeLeague)
        .eq("show_issetlistgame", true)
        .order("show_canonid", { ascending: true })

      if (error) {
        console.error("Error fetching tour shows:", error)
        return
      }

      const processedShows = [...(data ?? [])]

      for (const show of processedShows) {
        try {
          const { count, error: countError } = await supabase
            .from("setlist_game_submissions")
            .select("*", { count: "exact", head: true })
            .eq("show_id", show.show_id)

          ;(show as GameShow).playerCount = countError ? 0 : count ?? 0

          const { data: submissions, error: subError } = await supabase
            .from("setlist_game_submissions")
            .select(
              "submission_id, score, total_songs_picked, total_songs_played"
            )
            .eq("show_id", show.show_id)

          if (!subError && submissions && submissions.length > 0) {
            const sg = show as GameShow
            sg.highScore = Math.max(...submissions.map((s) => s.score ?? 0))
            sg.averageScore = Number(
              (
                submissions.reduce((sum, s) => sum + (s.score ?? 0), 0) /
                submissions.length
              ).toFixed(2)
            )

            const overUnders = submissions.map((s) => {
              const played = s.total_songs_played ?? 0
              const picked = s.total_songs_picked ?? 0
              return picked - played
            })
            sg.averageOverUnder = Number(
              (overUnders.reduce((a, b) => a + b, 0) / submissions.length).toFixed(
                2
              )
            )

            const submissionIds = submissions.map((s) => s.submission_id)
            const { data: picks, error: picksError } = await supabase
              .from("setlist_game_picks")
              .select(
                "submission_id, result, showopener_correct, showcloser_correct"
              )
              .in("submission_id", submissionIds)

            if (!picksError && picks && picks.length > 0) {
              sg.totalCorrectSongs = picks.filter(
                (p) => p.result !== "not_played"
              ).length
              const correctSetResults = [
                "correct_song_set",
                "correct_song_set_setnum",
                "correct_song_set_openercloserencore",
                "correct_song_set_setnum_openercloserencore",
              ]
              sg.totalCorrectSets = picks.filter((p) =>
                correctSetResults.includes(p.result ?? "")
              ).length

              const submissionPicks: Record<
                string,
                {
                  correctSongs: number
                  correctSets: number
                  pickedOpener: boolean
                  pickedCloser: boolean
                }
              > = {}
              picks.forEach((pick) => {
                if (!submissionPicks[pick.submission_id]) {
                  submissionPicks[pick.submission_id] = {
                    correctSongs: 0,
                    correctSets: 0,
                    pickedOpener: false,
                    pickedCloser: false,
                  }
                }
                if (pick.result !== "not_played") {
                  submissionPicks[pick.submission_id].correctSongs++
                }
                if (correctSetResults.includes(pick.result ?? "")) {
                  submissionPicks[pick.submission_id].correctSets++
                }
                if (pick.showopener_correct) {
                  submissionPicks[pick.submission_id].pickedOpener = true
                }
                if (pick.showcloser_correct) {
                  submissionPicks[pick.submission_id].pickedCloser = true
                }
              })

              const vals = Object.values(submissionPicks)
              sg.usersPickedOpener = vals.filter((p) => p.pickedOpener).length
              sg.usersPickedCloser = vals.filter((p) => p.pickedCloser).length
              if (vals.length > 0) {
                sg.averageCorrectSongs = Number(
                  (
                    vals.reduce((s, v) => s + v.correctSongs, 0) / vals.length
                  ).toFixed(2)
                )
                sg.averageCorrectSets = Number(
                  (
                    vals.reduce((s, v) => s + v.correctSets, 0) / vals.length
                  ).toFixed(2)
                )
              }
            }
          }
        } catch (err) {
          console.error(`Exception processing show ${show.show_id}:`, err)
        }
      }

      setShowsWithStats(processedShows as GameShow[])
    } catch (error) {
      console.error("Error in tour shows fetch:", error)
    } finally {
      setShowStatsLoading(false)
    }
  }, [activeLeague])

  useEffect(() => {
    fetchShowStatistics()
  }, [fetchShowStatistics])

  return { showStatsLoading, showsWithStats }
}
