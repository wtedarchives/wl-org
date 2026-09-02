"use client"

import { useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

const PAGE_SIZE = 1000

function formatCount(n: number, noun: string) {
  return `${n} ${noun}${n === 1 ? "" : "s"}`
}

export function formatEchoTourSummary(showCount: number, playerCount: number) {
  return `${formatCount(showCount, "show")} · ${formatCount(playerCount, "player")} this tour`
}

async function fetchDistinctPlayerCount(showIds: string[]): Promise<number> {
  if (!supabase || showIds.length === 0) return 0

  const userIds = new Set<string>()
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from("setlist_game_submissions")
      .select("user_id")
      .in("show_id", showIds)
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      console.error("Error fetching Echo tour players:", error.message)
      return userIds.size
    }

    if (!data?.length) break

    for (const row of data) {
      if (row.user_id) userIds.add(row.user_id)
    }

    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return userIds.size
}

export function useEchoTourSummary(league: string): {
  loading: boolean
  summary: string | null
} {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchSummary() {
      if (!supabase) {
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        const { data: shows, error: showsError } = await supabase
          .from("shows")
          .select("show_id")
          .eq("show_tour", league)
          .eq("show_issetlistgame", true)

        if (showsError) {
          console.error("Error fetching Echo tour shows:", showsError.message)
          if (!cancelled) {
            setSummary(null)
            setLoading(false)
          }
          return
        }

        const showIds = (shows ?? []).map((s) => s.show_id)
        const playerCount = await fetchDistinctPlayerCount(showIds)

        if (!cancelled) {
          setSummary(formatEchoTourSummary(showIds.length, playerCount))
        }
      } catch (error) {
        console.error("Error in Echo tour summary fetch:", error)
        if (!cancelled) setSummary(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchSummary()
    return () => {
      cancelled = true
    }
  }, [league])

  return { loading, summary }
}
