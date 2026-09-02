"use client"

import { useCallback, useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

export type EchoLiveStandingRow = {
  rank: number
  userId: string
  username: string
  totalPoints: number
  songsCorrect: number
  showOpenerPicked: boolean
  showCloserPicked: boolean
  isMe: boolean
}

const EMPTY: EchoLiveStandingRow[] = []

const ID_CHUNK = 100
const ROW_BATCH = 1000

async function fetchPicksForSubmissions(
  submissionIds: string[],
): Promise<
  Array<{
    submission_id: string
    result: string | null
    showopener_correct: boolean | null
    showcloser_correct: boolean | null
  }>
> {
  if (!supabase || submissionIds.length === 0) return []

  const rows: Array<{
    submission_id: string
    result: string | null
    showopener_correct: boolean | null
    showcloser_correct: boolean | null
  }> = []

  for (let i = 0; i < submissionIds.length; i += ID_CHUNK) {
    const chunk = submissionIds.slice(i, i + ID_CHUNK)
    let from = 0
    while (true) {
      const { data, error } = await supabase
        .from("setlist_game_picks")
        .select(
          "submission_id, result, showopener_correct, showcloser_correct",
        )
        .in("submission_id", chunk)
        .range(from, from + ROW_BATCH - 1)

      if (error) {
        console.error("Error fetching Echo live standings picks:", error.message)
        break
      }

      const batch = data ?? []
      rows.push(...batch)
      if (batch.length < ROW_BATCH) break
      from += ROW_BATCH
    }
  }

  return rows
}

export function useEchoLiveStandings(
  showId: string | null,
  scored: boolean,
  profileId: string | undefined,
  live = false,
  refreshKey = 0,
): { loading: boolean; standings: EchoLiveStandingRow[] } {
  const [loading, setLoading] = useState(true)
  const [standings, setStandings] = useState<EchoLiveStandingRow[]>(EMPTY)

  const load = useCallback(async () => {
    if (!showId || !supabase) {
      setStandings(EMPTY)
      setLoading(false)
      return
    }

    try {
      const { data: submissions, error: subError } = await supabase
        .from("setlist_game_submissions")
        .select("submission_id, user_id, score, score_provisional")
        .eq("show_id", showId)

      if (subError) {
        console.error("Error fetching Echo live standings:", subError.message)
        setStandings(EMPTY)
        return
      }

      if (!submissions?.length) {
        setStandings(EMPTY)
        return
      }

      const userIds = [...new Set(submissions.map((row) => row.user_id))]
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds)

      const usernameMap =
        profiles?.reduce(
          (acc, profile) => {
            acc[profile.id] = profile.username
            return acc
          },
          {} as Record<string, string>,
        ) ?? {}

      const submissionIds = submissions.map((row) => row.submission_id)
      const picks = await fetchPicksForSubmissions(submissionIds)

      const openerCloserBySubmission = picks.reduce(
        (acc, pick) => {
          const current = acc[pick.submission_id] ?? {
            showOpenerPicked: false,
            showCloserPicked: false,
            songsCorrect: 0,
          }
          if (pick.showopener_correct) current.showOpenerPicked = true
          if (pick.showcloser_correct) current.showCloserPicked = true
          if (pick.result && pick.result !== "not_played") {
            current.songsCorrect += 1
          }
          acc[pick.submission_id] = current
          return acc
        },
        {} as Record<
          string,
          {
            showOpenerPicked: boolean
            showCloserPicked: boolean
            songsCorrect: number
          }
        >,
      )

      const rows = submissions
        .map((submission) => {
          const username =
            (usernameMap[submission.user_id] ??
              submission.user_id.substring(0, 8)).split("@")[0]
          const flags = openerCloserBySubmission[submission.submission_id] ?? {
            showOpenerPicked: false,
            showCloserPicked: false,
            songsCorrect: 0,
          }
          const totalPoints =
            scored ?
              (submission.score ?? 0)
            : (submission.score_provisional ?? 0)

          return {
            userId: submission.user_id,
            username,
            totalPoints,
            songsCorrect: flags.songsCorrect,
            showOpenerPicked: flags.showOpenerPicked,
            showCloserPicked: flags.showCloserPicked,
            isMe: Boolean(profileId && submission.user_id === profileId),
          }
        })
        .sort(
          (a, b) =>
            b.totalPoints - a.totalPoints ||
            a.username.localeCompare(b.username),
        )
        .map((row, index) => ({ ...row, rank: index + 1 }))

      setStandings(rows)
    } catch (error) {
      console.error("Error in Echo live standings fetch:", error)
      setStandings(EMPTY)
    } finally {
      setLoading(false)
    }
  }, [profileId, refreshKey, scored, showId])

  useEffect(() => {
    setLoading(true)
    void load()
  }, [load])

  useEffect(() => {
    if (!showId || !live) return

    const timerId = window.setInterval(() => {
      void load()
    }, 15000)

    return () => window.clearInterval(timerId)
  }, [live, load, showId])

  return { loading, standings }
}
