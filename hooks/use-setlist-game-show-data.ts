"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

export interface GameShow {
  show_id: string
  show_date: string
  show_subvenue: string
  show_venue_location: string
  show_time: string
  show_tour: string
  show_canonid?: string
  show_subvenue_venue: string
  show_detail?: string | null
  show_scored?: boolean
  timeRemaining?: string
  isSelectionClosed?: boolean
  submission_id?: string
  playerCount?: number
  tours?: { tour_id: string } | null
}

export interface PlayerStats {
  username: string
  userId: string
  totalPoints: number
  showsPlayed: number
  songsPicked: number
  setsPicked: number
  showOpenerPicked: boolean
  showCloserPicked: boolean
}

export interface SongStat {
  song: string
  count: number
  percentage: number
  categoryId?: number
  song_id?: string
  category_artwork?: string
}

export interface SubmissionDetails {
  totalScore: number
  songsPicked: number
  songsPlayed: number
  setlist: Array<{
    entry_song: string
    entry_set: string
    entry_setnum: number
    entry_placement: string
  }>
  username?: string
}

export function useSetlistGameShowData(
  showId: string | undefined,
  user: User | null
) {
  const [loading, setLoading] = useState(true)
  const [show, setShow] = useState<GameShow | null>(null)
  const [standings, setStandings] = useState<PlayerStats[]>([])
  const [totalPlayers, setTotalPlayers] = useState(0)
  const [userSubmission, setUserSubmission] = useState<string | null>(null)

  useEffect(() => {
    async function fetchShowDetails() {
      if (!showId || !supabase) return

      try {
        setLoading(true)

        const { data, error } = await supabase
          .from("shows")
          .select(
            `
            show_id, show_date, show_subvenue, show_venue_location, show_time,
            show_tour, show_canonid, show_subvenue_venue, show_scored, show_detail,
            tours!shows_show_tour_fkey(tour_id)
          `
          )
          .eq("show_id", showId)
          .single()

        if (error) {
          console.error("Error fetching show details:", error)
          setLoading(false)
          return
        }

        if (!data) {
          setLoading(false)
          return
        }

        const now = new Date()
        const showDateTime = new Date(data.show_time)
        const oneHourBefore = new Date(showDateTime)
        oneHourBefore.setHours(oneHourBefore.getHours() - 1)
        const isSelectionClosed = now >= oneHourBefore

        let timeRemaining = ""
        if (!isSelectionClosed) {
          const timeDiff = oneHourBefore.getTime() - now.getTime()
          const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
          const hours = Math.floor(
            (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          )
          const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
          if (days > 0) timeRemaining = `${days}d ${hours}h`
          else if (hours > 0) timeRemaining = `${hours}h ${minutes}m`
          else timeRemaining = `${minutes}m`
        }

        if (user) {
          const { data: subData, error: subError } = await supabase
            .from("setlist_game_submissions")
            .select("submission_id")
            .eq("user_id", user.id)
            .eq("show_id", showId)
            .single()

          if (!subError && subData) {
            setUserSubmission(subData.submission_id)
          }
        }

        const toursRaw = data.tours as { tour_id: string }[] | { tour_id: string } | null
        const tours =
          Array.isArray(toursRaw) && toursRaw.length > 0
            ? toursRaw[0]
            : toursRaw && !Array.isArray(toursRaw)
              ? toursRaw
              : null

        setShow({
          ...data,
          tours,
          timeRemaining,
          isSelectionClosed,
        })
      } catch (err) {
        console.error("Error in show fetch:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchShowDetails()
  }, [showId, user])

  useEffect(() => {
    async function fetchPlayerCount() {
      if (!showId || !supabase) return

      try {
        const { count, error } = await supabase
          .from("setlist_game_submissions")
          .select("*", { count: "exact", head: true })
          .eq("show_id", showId)

        setTotalPlayers(!error && count != null ? count : 0)
      } catch {
        setTotalPlayers(0)
      }
    }

    fetchPlayerCount()
  }, [showId])

  useEffect(() => {
    async function fetchStandings() {
      if (!showId || !show?.show_scored || !supabase) return

      try {
        const { data: submissionsData, error: subError } = await supabase
          .from("setlist_game_submissions")
          .select("submission_id, user_id, score, total_songs_picked")
          .eq("show_id", showId)

        if (subError || !submissionsData || submissionsData.length === 0) {
          setStandings([])
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
            "submission_id, result, set, placement, showcloser_correct, showopener_correct"
          )
          .in("submission_id", submissionIds)

        const picksBySubmission =
          picksData?.reduce(
            (acc, pick) => {
              if (!acc[pick.submission_id]) acc[pick.submission_id] = []
              acc[pick.submission_id].push(pick)
              return acc
            },
            {} as Record<string, (typeof picksData)[number][]>
          ) ?? {}

        const correctSetResults = [
          "correct_song_set",
          "correct_song_set_setnum",
          "correct_song_set_openercloserencore",
          "correct_song_set_setnum_openercloserencore",
        ]

        const playerStatsArray: PlayerStats[] = submissionsData.map((sub) => {
          const username =
            (usernameMap[sub.user_id] ?? sub.user_id.substring(0, 8)).split(
              "@"
            )[0]
          const userPicks = picksBySubmission[sub.submission_id] ?? []

          const songsPicked = userPicks.filter(
            (p) => p.result && p.result !== "not_played"
          ).length
          const setsPicked = userPicks.filter((p) =>
            correctSetResults.includes(p.result ?? "")
          ).length
          const showCloserPicked = userPicks.some(
            (p) => p.showcloser_correct === true
          )
          const showOpenerPicked = userPicks.some(
            (p) => p.showopener_correct === true
          )

          return {
            username,
            userId: sub.user_id,
            totalPoints: sub.score ?? 0,
            showsPlayed: 1,
            songsPicked,
            setsPicked,
            showOpenerPicked,
            showCloserPicked,
          }
        })

        setStandings(
          playerStatsArray.sort((a, b) => b.totalPoints - a.totalPoints)
        )
      } catch (err) {
        console.error("Error fetching standings:", err)
      }
    }

    fetchStandings()
  }, [showId, show?.show_scored])

  return {
    loading,
    show,
    standings,
    totalPlayers,
    userSubmission,
  }
}
