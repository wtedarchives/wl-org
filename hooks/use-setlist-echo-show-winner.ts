"use client"

import { useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

function formatWinnerLabel(
  winners: { username: string; score: number }[],
): string | null {
  if (winners.length === 0) return null
  return winners
    .map((winner) => `${winner.username} (${winner.score})`)
    .join(", ")
}

export function useSetlistEchoShowWinner(
  showId: string | undefined,
  showScored: boolean | undefined,
): {
  winnerLabel: string | null
  loading: boolean
} {
  const [winnerLabel, setWinnerLabel] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!showId || !showScored || !supabase) {
      setWinnerLabel(null)
      setLoading(false)
      return
    }

    let cancelled = false
    const client = supabase

    async function fetchWinner() {
      setLoading(true)
      try {
        const { data: submissions, error } = await client
          .from("setlist_game_submissions")
          .select("user_id, score")
          .eq("show_id", showId)
          .order("score", { ascending: false })

        if (cancelled) return

        if (error || !submissions?.length) {
          setWinnerLabel(null)
          return
        }

        const topScore = submissions[0]?.score ?? 0
        const topSubmissions = submissions.filter(
          (submission) => (submission.score ?? 0) === topScore,
        )
        const userIds = [...new Set(topSubmissions.map((sub) => sub.user_id))]

        const { data: profiles } = await client
          .from("profiles")
          .select("id, username")
          .in("id", userIds)

        if (cancelled) return

        const usernameById =
          profiles?.reduce(
            (acc, profile) => {
              acc[profile.id] = profile.username
              return acc
            },
            {} as Record<string, string>,
          ) ?? {}

        const winners = topSubmissions.map((submission) => ({
          username:
            usernameById[submission.user_id] ??
            submission.user_id.substring(0, 8),
          score: submission.score ?? 0,
        }))

        setWinnerLabel(formatWinnerLabel(winners))
      } catch {
        if (!cancelled) setWinnerLabel(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchWinner()

    return () => {
      cancelled = true
    }
  }, [showId, showScored])

  return { winnerLabel, loading }
}
