"use client"

import { useCallback, useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

const CORRECT_SET_RESULTS = [
  "correct_song_set",
  "correct_song_set_setnum",
  "correct_song_set_openercloserencore",
  "correct_song_set_setnum_openercloserencore",
] as const

const ID_CHUNK = 100
const ROW_BATCH = 1000

export type EchoProfileTourRow = {
  tour: string
  tourId: string
  rank: number | null
  totalPoints: number
  showCount: number
  tourCanonId: number | null
}

export type EchoProfileShowRow = {
  showId: string
  showDate: string
  showCanonId: number | null
  tour: string
  tourId: string
  totalPoints: number
  songsCorrect: number
  setsCorrect: number
  showOpenerPicked: boolean
  showCloserPicked: boolean
  scored: boolean
}

type ShowRow = {
  show_id: string
  show_date: string
  show_tour: string
  show_scored: boolean
  show_canonid: number | null
}

async function fetchPicksForSubmissions(submissionIds: string[]) {
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
        console.error("Error fetching Echo profile picks:", error.message)
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

function compareTourRows(a: EchoProfileTourRow, b: EchoProfileTourRow): number {
  if (a.tourCanonId != null && b.tourCanonId != null) {
    return b.tourCanonId - a.tourCanonId
  }
  return b.tour.localeCompare(a.tour)
}

function compareShowRows(a: EchoProfileShowRow, b: EchoProfileShowRow): number {
  if (a.showCanonId != null && b.showCanonId != null) {
    return b.showCanonId - a.showCanonId
  }
  return b.showDate.localeCompare(a.showDate)
}

export function useEchoProfile(profileId: string | undefined): {
  loading: boolean
  tours: EchoProfileTourRow[]
  shows: EchoProfileShowRow[]
} {
  const [loading, setLoading] = useState(Boolean(profileId))
  const [tours, setTours] = useState<EchoProfileTourRow[]>([])
  const [shows, setShows] = useState<EchoProfileShowRow[]>([])

  const load = useCallback(async () => {
    if (!profileId || !supabase) {
      setTours([])
      setShows([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const { data: submissions, error: subError } = await supabase
        .from("setlist_game_submissions")
        .select("submission_id, show_id, score, score_provisional")
        .eq("user_id", profileId)

      if (subError) {
        console.error("Error fetching Echo profile submissions:", subError.message)
        setTours([])
        setShows([])
        return
      }

      if (!submissions?.length) {
        setTours([])
        setShows([])
        return
      }

      const showIds = [...new Set(submissions.map((row) => row.show_id))]

      const { data: showRows, error: showError } = await supabase
        .from("shows")
        .select("show_id, show_date, show_tour, show_scored, show_canonid")
        .in("show_id", showIds)
        .eq("show_issetlistgame", true)

      if (showError) {
        console.error("Error fetching Echo profile shows:", showError.message)
        setTours([])
        setShows([])
        return
      }

      const showMap = new Map(
        (showRows ?? []).map((row) => [row.show_id, row as ShowRow]),
      )

      const userSubs = submissions.filter((sub) => showMap.has(sub.show_id))
      if (userSubs.length === 0) {
        setTours([])
        setShows([])
        return
      }

      const tourNames = [
        ...new Set(
          userSubs
            .map((sub) => showMap.get(sub.show_id)?.show_tour)
            .filter(Boolean) as string[],
        ),
      ]

      const { data: tourRows } = await supabase
        .from("tours")
        .select("tour, tour_id, tour_canonid")
        .in("tour", tourNames)

      const tourMap = new Map(
        (tourRows ?? []).map((row) => [
          row.tour,
          {
            tourId: row.tour_id,
            tourCanonId: row.tour_canonid ?? null,
          },
        ]),
      )

      const submissionIds = userSubs.map((row) => row.submission_id)
      const picks = await fetchPicksForSubmissions(submissionIds)

      const pickStatsBySubmission = picks.reduce(
        (acc, pick) => {
          const current = acc[pick.submission_id] ?? {
            songsCorrect: 0,
            setsCorrect: 0,
            showOpenerPicked: false,
            showCloserPicked: false,
          }

          if (pick.showopener_correct) current.showOpenerPicked = true
          if (pick.showcloser_correct) current.showCloserPicked = true
          if (pick.result && pick.result !== "not_played") {
            current.songsCorrect += 1
          }
          if (
            pick.result &&
            CORRECT_SET_RESULTS.includes(
              pick.result as (typeof CORRECT_SET_RESULTS)[number],
            )
          ) {
            current.setsCorrect += 1
          }

          acc[pick.submission_id] = current
          return acc
        },
        {} as Record<
          string,
          {
            songsCorrect: number
            setsCorrect: number
            showOpenerPicked: boolean
            showCloserPicked: boolean
          }
        >,
      )

      const nextShows: EchoProfileShowRow[] = userSubs
        .map((sub) => {
          const show = showMap.get(sub.show_id)
          if (!show) return null

          const tourMeta = tourMap.get(show.show_tour)
          const pickStats = pickStatsBySubmission[sub.submission_id] ?? {
            songsCorrect: 0,
            setsCorrect: 0,
            showOpenerPicked: false,
            showCloserPicked: false,
          }

          return {
            showId: show.show_id,
            showDate: show.show_date,
            showCanonId: show.show_canonid,
            tour: show.show_tour,
            tourId: tourMeta?.tourId ?? "",
            totalPoints:
              show.show_scored ?
                (sub.score ?? 0)
              : (sub.score_provisional ?? 0),
            songsCorrect: pickStats.songsCorrect,
            setsCorrect: pickStats.setsCorrect,
            showOpenerPicked: pickStats.showOpenerPicked,
            showCloserPicked: pickStats.showCloserPicked,
            scored: Boolean(show.show_scored),
          }
        })
        .filter((row): row is EchoProfileShowRow => row != null)
        .sort(compareShowRows)

      const { data: scoredTourShows } = await supabase
        .from("shows")
        .select("show_id, show_tour")
        .in("show_tour", tourNames)
        .eq("show_issetlistgame", true)
        .eq("show_scored", true)

      const scoredShowIds = (scoredTourShows ?? []).map((row) => row.show_id)
      const showTourById = new Map(
        (scoredTourShows ?? []).map((row) => [row.show_id, row.show_tour]),
      )

      const tourPointsByUser = new Map<string, Map<string, number>>()

      if (scoredShowIds.length > 0) {
        const { data: rankedSubs } = await supabase
          .from("setlist_game_submissions")
          .select("user_id, show_id, score")
          .in("show_id", scoredShowIds)
          .not("score", "is", null)

        for (const sub of rankedSubs ?? []) {
          const tour = showTourById.get(sub.show_id)
          if (!tour) continue

          if (!tourPointsByUser.has(tour)) {
            tourPointsByUser.set(tour, new Map())
          }

          const byUser = tourPointsByUser.get(tour)!
          byUser.set(sub.user_id, (byUser.get(sub.user_id) ?? 0) + (sub.score ?? 0))
        }
      }

      const userTourTotals = new Map<string, { totalPoints: number; showCount: number }>()
      for (const showRow of nextShows) {
        const current = userTourTotals.get(showRow.tour) ?? {
          totalPoints: 0,
          showCount: 0,
        }
        current.totalPoints += showRow.totalPoints
        current.showCount += 1
        userTourTotals.set(showRow.tour, current)
      }

      const nextTours: EchoProfileTourRow[] = [...userTourTotals.entries()]
        .map(([tour, totals]) => {
          const tourMeta = tourMap.get(tour)
          const pointsByUser = tourPointsByUser.get(tour)
          let rank: number | null = null

          if (pointsByUser && pointsByUser.has(profileId)) {
            const userScore = pointsByUser.get(profileId) ?? 0
            const entries = [...pointsByUser.entries()].sort(
              (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
            )
            rank = entries.findIndex(([, score]) => score === userScore) + 1
            if (rank <= 0) rank = null
          }

          return {
            tour,
            tourId: tourMeta?.tourId ?? "",
            rank,
            totalPoints: totals.totalPoints,
            showCount: totals.showCount,
            tourCanonId: tourMeta?.tourCanonId ?? null,
          }
        })
        .sort(compareTourRows)

      setTours(nextTours)
      setShows(nextShows)
    } catch (error) {
      console.error("Error in Echo profile fetch:", error)
      setTours([])
      setShows([])
    } finally {
      setLoading(false)
    }
  }, [profileId])

  useEffect(() => {
    void load()
  }, [load])

  return { loading, tours, shows }
}
