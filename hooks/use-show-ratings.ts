import { useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

interface ShowSlice {
  show_id: string
}

export function useShowRatings(filteredShows: ShowSlice[]) {
  const [showRatings, setShowRatings] = useState<Record<string, number>>({})

  useEffect(() => {
    async function fetchShowRatings() {
      if (!supabase) {
        setShowRatings({})
        return
      }
      if (filteredShows.length === 0) {
        setShowRatings({})
        return
      }

      try {
        const client = supabase
        const showIds = filteredShows.map((s) => s.show_id)

        const { data, error } = await client
          .from("show_ratings")
          .select("show_id, rating")
          .in("show_id", showIds)

        if (error) throw error

        const ratings: Record<string, number> = {}
        filteredShows.forEach((show) => {
          const showRatingsData =
            data?.filter((r) => r.show_id === show.show_id) ?? []
          if (showRatingsData.length > 0) {
            const average =
              showRatingsData.reduce((sum, r) => sum + (r as any).rating, 0) /
              showRatingsData.length
            ratings[show.show_id] = Math.round(average * 100) / 100
          } else {
            ratings[show.show_id] = 0
          }
        })

        setShowRatings(ratings)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching show ratings:", err)
      }
    }

    fetchShowRatings()
  }, [filteredShows])

  return { showRatings }
}

