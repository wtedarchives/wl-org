"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

export interface TourGameShow {
  show_id: string
  show_date: string
  show_subvenue: string
  show_venue_location: string
  show_time: string
  show_tour: string
  show_scored?: boolean
  show_detail?: string | null
  playerCount?: number
  highScore?: number
  averageScore?: number
  averageOverUnder?: number
  totalCorrectSongs?: number
  averageCorrectSongs?: number
  totalCorrectSets?: number
  averageCorrectSets?: number
  usersPickedOpener?: number
  usersPickedCloser?: number
}

export interface TourPlayerStats {
  username: string
  userId: string
  totalPoints: number
  showsPlayed: number
  songsPicked: number
  setsPicked: number
  showOpenersPicked: number
  showClosersPicked: number
  avgPointsPerShow: number
}

export interface TourInfo {
  tour: string
  tour_id: string
  tour_canonid?: number
}

export interface TourStats {
  totalShows: number
  totalPlayers: number
  tourWinners: { username: string; score: number }[]
}

const CORRECT_SET_RESULTS = [
  "correct_song_set",
  "correct_song_set_setnum",
  "correct_song_set_openercloserencore",
  "correct_song_set_setnum_openercloserencore",
]

export function useSetlistGameTourDetails(tourId: string | undefined) {
  const [loading, setLoading] = useState(true)
  const [tourInfo, setTourInfo] = useState<TourInfo | null>(null)
  const [gameShows, setGameShows] = useState<TourGameShow[]>([])
  const [standings, setStandings] = useState<TourPlayerStats[]>([])
  const [tourStats, setTourStats] = useState<TourStats>({
    totalShows: 0,
    totalPlayers: 0,
    tourWinners: [],
  })

  const fetchTourInfo = useCallback(async () => {
    if (!tourId || !supabase) return null
    const { data, error } = await supabase
      .from("tours")
      .select("tour, tour_id, tour_canonid")
      .eq("tour_id", tourId)
      .single()
    if (error) return null
    setTourInfo(data)
    return data
  }, [tourId])

  const fetchGameShows = useCallback(
    async (tourName: string) => {
      if (!supabase) return []

      const { data, error } = await supabase
        .from("shows")
        .select(
          "show_id, show_date, show_subvenue, show_venue_location, show_time, show_tour, show_scored, show_detail, show_canonid, show_subvenue_venue"
        )
        .eq("show_tour", tourName)
        .eq("show_issetlistgame", true)
        .order("show_canonid", { ascending: true })

      if (error || !data) return []

      const processed: TourGameShow[] = []
      for (const show of data) {
        const sg: TourGameShow = { ...show }
        try {
          const { count } = await supabase
            .from("setlist_game_submissions")
            .select("*", { count: "exact", head: true })
            .eq("show_id", show.show_id)
          sg.playerCount = count ?? 0

          const { data: submissions } = await supabase
            .from("setlist_game_submissions")
            .select("submission_id, score, total_songs_picked, total_songs_played")
            .eq("show_id", show.show_id)

          if (submissions?.length) {
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
              (
                overUnders.reduce((a, b) => a + b, 0) / submissions.length
              ).toFixed(2)
            )

            const submissionIds = submissions.map((s) => s.submission_id)
            const { data: picks } = await supabase
              .from("setlist_game_picks")
              .select(
                "submission_id, result, showopener_correct, showcloser_correct"
              )
              .in("submission_id", submissionIds)

            if (picks?.length) {
              sg.totalCorrectSongs = picks.filter(
                (p) => p.result !== "not_played"
              ).length
              sg.totalCorrectSets = picks.filter((p) =>
                CORRECT_SET_RESULTS.includes(p.result ?? "")
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
                if (CORRECT_SET_RESULTS.includes(pick.result ?? "")) {
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
          console.error(`Error processing show ${show.show_id}:`, err)
        }
        processed.push(sg)
      }
      return processed
    },
    []
  )

  const fetchStandings = useCallback(
    async (tourName: string) => {
      if (!supabase) return { standings: [], tourStats: { totalPlayers: 0, tourWinners: [] } }

      const { data: showData } = await supabase
        .from("shows")
        .select("show_id")
        .eq("show_tour", tourName)
        .eq("show_scored", true)
        .eq("show_issetlistgame", true)

      if (!showData?.length) {
        return { standings: [], tourStats: { totalPlayers: 0, tourWinners: [] } }
      }

      const showIds = showData.map((s) => s.show_id)
      const { data: submissionsData } = await supabase
        .from("setlist_game_submissions")
        .select(
          "submission_id, user_id, show_id, score, total_songs_picked, total_songs_played"
        )
        .in("show_id", showIds)

      if (!submissionsData?.length) {
        return { standings: [], tourStats: { totalPlayers: 0, tourWinners: [] } }
      }

      const userIds = [...new Set(submissionsData.map((s) => s.user_id))]
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds)

      const usernameMap: Record<string, string> = {}
      profilesData?.forEach((p) => {
        usernameMap[p.id] = p.username
      })

      const submissionIds = submissionsData.map((s) => s.submission_id)
      const { data: picksData } = await supabase
        .from("setlist_game_picks")
        .select(
          "submission_id, result, showopener_correct, showcloser_correct"
        )
        .in("submission_id", submissionIds)
        .neq("result", "not_played")

      const userStats: Record<
        string,
        {
          totalPoints: number
          showsPlayed: number
          songsPicked: number
          setsPicked: number
          showOpenersPicked: number
          showClosersPicked: number
        }
      > = {}
      userIds.forEach((id) => {
        userStats[id] = {
          totalPoints: 0,
          showsPlayed: 0,
          songsPicked: 0,
          setsPicked: 0,
          showOpenersPicked: 0,
          showClosersPicked: 0,
        }
      })

      submissionsData.forEach((sub) => {
        userStats[sub.user_id].totalPoints += sub.score ?? 0
        userStats[sub.user_id].showsPlayed += 1
      })

      picksData?.forEach((pick) => {
        const sub = submissionsData.find((s) => s.submission_id === pick.submission_id)
        if (!sub) return
        const uid = sub.user_id
        if (pick.result !== "not_played") userStats[uid].songsPicked += 1
        if (CORRECT_SET_RESULTS.includes(pick.result ?? "")) {
          userStats[uid].setsPicked += 1
        }
        if (pick.showopener_correct) userStats[uid].showOpenersPicked += 1
        if (pick.showcloser_correct) userStats[uid].showClosersPicked += 1
      })

      const standingsArray: TourPlayerStats[] = userIds.map((userId) => {
        const s = userStats[userId]
        const username = (usernameMap[userId] ?? userId.slice(0, 8)).split("@")[0]
        return {
          username,
          userId,
          totalPoints: s.totalPoints,
          showsPlayed: s.showsPlayed,
          songsPicked: s.songsPicked,
          setsPicked: s.setsPicked,
          showOpenersPicked: s.showOpenersPicked,
          showClosersPicked: s.showClosersPicked,
          avgPointsPerShow:
            s.showsPlayed > 0
              ? Number((s.totalPoints / s.showsPlayed).toFixed(2))
              : 0,
        }
      })

      const sorted = [...standingsArray].sort((a, b) => {
        if (a.totalPoints !== b.totalPoints) return b.totalPoints - a.totalPoints
        if (a.avgPointsPerShow !== b.avgPointsPerShow)
          return b.avgPointsPerShow - a.avgPointsPerShow
        if (a.songsPicked !== b.songsPicked)
          return b.songsPicked - a.songsPicked
        return a.username.localeCompare(b.username)
      })

      const highestScore = sorted[0]?.totalPoints ?? 0
      const tourWinners = sorted
        .filter((p) => p.totalPoints === highestScore)
        .map((p) => ({ username: p.username, score: p.totalPoints }))

      return {
        standings: sorted,
        tourStats: {
          totalPlayers: userIds.length,
          tourWinners,
        },
      }
    },
    []
  )

  useEffect(() => {
    async function run() {
      if (!tourId || !supabase) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const info = await fetchTourInfo()
        if (!info) {
          setLoading(false)
          return
        }
        const [shows, { standings: st, tourStats: ts }] = await Promise.all([
          fetchGameShows(info.tour),
          fetchStandings(info.tour),
        ])
        setGameShows(shows)
        setStandings(st)
        setTourStats((prev) => ({
          ...prev,
          totalShows: shows.length,
          totalPlayers: ts.totalPlayers,
          tourWinners: ts.tourWinners,
        }))
      } catch (err) {
        console.error("Error fetching tour details:", err)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [tourId, fetchTourInfo, fetchGameShows, fetchStandings])

  return {
    loading,
    tourInfo,
    gameShows,
    standings,
    tourStats,
  }
}
