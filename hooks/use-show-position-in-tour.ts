"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export interface ShowPositionInTour {
  position: number
  total: number
}

export function useShowPositionInTour(
  showId: string | undefined,
  tourName: string | undefined
) {
  const [state, setState] = useState<ShowPositionInTour | null>(null)

  useEffect(() => {
    if (!tourName || !showId || !supabase) {
      setState(null)
      return
    }
    const client = supabase

    async function run() {
      try {
        const { data, error } = await client
          .from("shows")
          .select("show_id, show_canonid, show_date, show_group")
          .eq("show_tour", tourName)

        if (error) throw error
        if (!data?.length) {
          setState(null)
          return
        }

        const sorted = [...data].sort(
          (a: { show_date: string; show_canonid: number | null; show_group: string }, b: { show_date: string; show_canonid: number | null; show_group: string }) => {
            const tA = new Date(a.show_date).getTime()
            const tB = new Date(b.show_date).getTime()
            if (tA !== tB) return tA - tB
            const aC = a.show_canonid !== null
            const bC = b.show_canonid !== null
            if (aC && bC) return a.show_canonid! - b.show_canonid!
            if (aC) return -1
            if (bC) return 1
            return (a.show_group ?? "").localeCompare(b.show_group ?? "")
          }
        )
        const idx = sorted.findIndex((s: { show_id: string }) => s.show_id === showId)
        if (idx >= 0) setState({ position: idx + 1, total: sorted.length })
        else setState(null)
      } catch (err) {
        console.error("Error calculating show position in tour:", err)
        setState(null)
      }
    }

    run()
  }, [showId, tourName])

  return state
}
