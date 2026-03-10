"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { ListShow } from "./use-list-show-data"

function timeToSeconds(timeStr: string): number {
  const parts = timeStr.split(":").map(Number)
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + (parts[2] ?? 0)
  }
  if (parts.length === 2) {
    return (parts[0] ?? 0) * 60 + (parts[1] ?? 0)
  }
  return 0
}

export function useLongestShowsList() {
  const [shows, setShows] = useState<ListShow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const client = supabase
    if (!client) {
      setLoading(false)
      return
    }

    async function fetchShows(sb: NonNullable<typeof supabase>) {
      setLoading(true)
      setError(null)
      try {
        const { data: rawData, error: fetchError } = await sb
          .from("shows")
          .select(
            `
            show_id,
            show_date,
            show_group,
            show_tour,
            show_subvenue,
            show_subvenue_venue,
            show_venue_location,
            show_detail,
            show_alert,
            show_wl_link,
            show_length,
            show_rarity,
            show_gap,
            subvenues:show_subvenue(
              venues:subvenue_venue(
                venue_id
              )
            ),
            tours:show_tour(
              tour_id
            )
          `,
          )
          .not("show_canonid", "is", null)
          .not("show_length", "is", null)
          .order("show_length", { ascending: false })
          .limit(50)

        if (fetchError) throw fetchError
        const allShows = rawData ?? []

        const withSeconds = allShows
          .filter((s) => s.show_length)
          .map((s) => ({
            show_id: s.show_id,
            show_date: s.show_date,
            show_group: s.show_group,
            show_tour: s.show_tour,
            tour_id: (Array.isArray(s.tours) ? s.tours[0] : s.tours)?.tour_id ?? null,
            show_subvenue: s.show_subvenue,
            show_subvenue_venue: s.show_subvenue_venue ?? null,
            show_venue_location: s.show_venue_location,
            show_detail: s.show_detail,
            show_alert: s.show_alert,
            show_wl_link: s.show_wl_link,
            venue_id: (() => {
              const sub = Array.isArray(s.subvenues) ? s.subvenues[0] : s.subvenues
              const ven = Array.isArray(sub?.venues) ? sub?.venues?.[0] : sub?.venues
              return ven?.venue_id ?? s.show_subvenue_venue ?? null
            })(),
            show_length: s.show_length,
            show_rarity:
              s.show_rarity != null
                ? `${Number(s.show_rarity).toFixed(2)}%`
                : null,
            show_gap:
              s.show_gap != null
                ? Number(s.show_gap).toFixed(2)
                : null,
            total_seconds: timeToSeconds(s.show_length),
          }))

        withSeconds.sort((a, b) => b.total_seconds - a.total_seconds)
        const top25 = withSeconds.slice(0, 25)

        let currentRank = 1
        const ranked = top25.map((show, i) => {
          const prev = top25[i - 1]
          const displayRank =
            i === 0 || prev.total_seconds !== show.total_seconds
              ? currentRank
              : null
          if (displayRank != null) currentRank = i + 2
          else currentRank++
          return {
            ...show,
            displayRank,
          } as ListShow & { displayRank: number | null }
        })

        setShows(ranked)
        setProgress(100)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load shows")
        setShows([])
      } finally {
        setLoading(false)
      }
    }

    fetchShows(client)
  }, [])

  return { shows, loading, error, progress }
}
