import { useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

interface ShowSlice {
  show_id: string
}

function showIdsKey(filteredShows: ShowSlice[]): string {
  return filteredShows.map((s) => s.show_id).join("\0")
}

export function useShowRatings(filteredShows: ShowSlice[]) {
  const [showRatings, setShowRatings] = useState<Record<string, number>>({})
  const idsKey = showIdsKey(filteredShows)

  useEffect(() => {
    const showIds = idsKey ? idsKey.split("\0") : []

    async function fetchShowRatings() {
      if (!supabase) {
        setShowRatings((prev) => (Object.keys(prev).length === 0 ? prev : {}))
        return
      }
      if (showIds.length === 0) {
        setShowRatings((prev) => (Object.keys(prev).length === 0 ? prev : {}))
        return
      }

      try {
        const client = supabase

        const { data, error } = await client
          .from("show_ratings")
          .select("show_id, rating")
          .in("show_id", showIds)

        if (error) throw error

        const ratings: Record<string, number> = {}
        showIds.forEach((showId) => {
          const showRatingsData =
            data?.filter((r) => r.show_id === showId) ?? []
          if (showRatingsData.length > 0) {
            const average =
              showRatingsData.reduce(
                (sum, r) => sum + (r as { rating: number }).rating,
                0,
              ) / showRatingsData.length
            ratings[showId] = Math.round(average * 100) / 100
          } else {
            ratings[showId] = 0
          }
        })

        setShowRatings(ratings)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching show ratings:", err)
      }
    }

    fetchShowRatings()
  }, [idsKey])

  return { showRatings }
}
