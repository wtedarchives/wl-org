"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { WysteriaSession } from "@/lib/jwt"

export interface GameShow {
  show_id: string
  show_date: string
  show_subvenue: string
  show_venue_location: string
  show_time: string
  show_tour: string
  show_canonid: string
  show_subvenue_venue: string
  show_detail: string
  show_scored?: boolean
  timeRemaining?: string
  isSelectionClosed?: boolean
  isLessThan24Hours?: boolean
  submission_id?: string
  score?: number
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

function calculateTimeRemaining(showTime: string): {
  timeRemaining: string
  isSelectionClosed: boolean
  isLessThan24Hours: boolean
} {
  // No show time set — picks are open indefinitely
  if (!showTime) {
    return { timeRemaining: "", isSelectionClosed: false, isLessThan24Hours: false }
  }

  const now = new Date()
  const showDateTime = new Date(showTime)

  // Invalid date — treat same as no show time
  if (Number.isNaN(showDateTime.getTime())) {
    return { timeRemaining: "", isSelectionClosed: false, isLessThan24Hours: false }
  }

  const oneHourBefore = new Date(showDateTime.getTime() - 60 * 60 * 1000)

  const isSelectionClosed = now >= oneHourBefore
  const isLessThan24Hours =
    oneHourBefore.getTime() - now.getTime() < 24 * 60 * 60 * 1000

  let timeRemaining = ""
  if (!isSelectionClosed) {
    const timeDiff = oneHourBefore.getTime() - now.getTime()
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
    const hours = Math.floor(
      (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    )
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) {
      timeRemaining = `${days}d ${hours}h`
    } else if (hours > 0) {
      timeRemaining = `${hours}h ${minutes}m`
    } else {
      timeRemaining = `${minutes}m`
    }
  }

  return { timeRemaining, isSelectionClosed, isLessThan24Hours }
}

function applyTimeDerivedFields(show: GameShow): GameShow {
  const { timeRemaining, isSelectionClosed, isLessThan24Hours } =
    calculateTimeRemaining(show.show_time ?? "")
  return { ...show, timeRemaining, isSelectionClosed, isLessThan24Hours }
}

export function useGameShows(
  activeLeague: string,
  session: WysteriaSession | null
): {
  loading: boolean
  gameShows: GameShow[]
  fetchGameShows: (options?: { silent?: boolean }) => Promise<void>
} {
  const [loading, setLoading] = useState(true)
  const [gameShows, setGameShows] = useState<GameShow[]>([])

  const fetchGameShows = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true
    if (!supabase) return

    try {
      if (!silent) setLoading(true)

      const { data, error } = await supabase
        .from("shows")
        .select(
          "show_id, show_date, show_subvenue, show_venue_location, show_time, show_tour, show_subvenue_venue, show_scored, show_detail, show_canonid"
        )
        .eq("show_tour", activeLeague)
        .eq("show_issetlistgame", true)
        .order("show_canonid", { ascending: true })

      if (error) {
        console.error("Error fetching game shows:", error.message, error.details)
        return
      }

      if (data) {
        const processedShows = data.map((show) =>
          applyTimeDerivedFields({
            ...show,
            show_detail: show.show_detail ?? "",
            playerCount: 0,
          } as GameShow)
        )

        if (session) {
          const showIds = processedShows.map((s) => s.show_id)

          const { data: submissionsData, error: submissionsError } =
            await supabase
              .from("setlist_game_submissions")
              .select("show_id, submission_id, score")
              .eq("user_id", session?.profileId)
              .in("show_id", showIds)

          if (!submissionsError && submissionsData) {
            const submissionMap = submissionsData.reduce(
              (acc, sub) => {
                acc[sub.show_id] = {
                  submission_id: sub.submission_id,
                  score: sub.score,
                }
                return acc
              },
              {} as Record<string, { submission_id: string; score: number | null }>
            )

            processedShows.forEach((show) => {
              const sub = submissionMap[show.show_id]
              if (sub) {
                ;(show as GameShow).submission_id = sub.submission_id
                ;(show as GameShow).score = sub.score ?? undefined
              }
            })
          }
        }

        for (const show of processedShows) {
          try {
            const { count, error: countError } = await supabase
              .from("setlist_game_submissions")
              .select("*", { count: "exact", head: true })
              .eq("show_id", show.show_id)

            if (!countError) {
              show.playerCount = count ?? 0
            } else {
              const { count: fallbackCount } = await supabase
                .from("setlist_game_submissions")
                .select("submission_id", { count: "exact", head: true })
                .eq("show_id", show.show_id)
              show.playerCount = fallbackCount ?? 0
            }
          } catch {
            show.playerCount = 0
          }
        }

        setGameShows(processedShows)
      }
    } catch (error) {
      console.error("Error in game shows fetch:", error)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [activeLeague, session])

  useEffect(() => {
    fetchGameShows()
  }, [fetchGameShows])

  useEffect(() => {
    if (gameShows.length === 0) return

    const updateTimers = () => {
      setGameShows((prev) => prev.map(applyTimeDerivedFields))
    }

    updateTimers()
    const timerId = setInterval(updateTimers, 60000)
    return () => clearInterval(timerId)
  }, [gameShows.length])

  return { loading, gameShows, fetchGameShows }
}
