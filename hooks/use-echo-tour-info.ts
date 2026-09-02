"use client"

import { useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

export type EchoTourInfo = {
  tour: string
  tour_id: string
  tour_canonid: number | null
}

export function useEchoTourInfo(tourId: string | null): {
  loading: boolean
  tour: EchoTourInfo | null
} {
  const [loading, setLoading] = useState(Boolean(tourId))
  const [tour, setTour] = useState<EchoTourInfo | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!tourId || !supabase) {
        setTour(null)
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        const { data, error } = await supabase
          .from("tours")
          .select("tour, tour_id, tour_canonid")
          .eq("tour_id", tourId)
          .maybeSingle()

        if (error) {
          console.error("Error fetching Echo tour info:", error.message)
        }

        if (!cancelled) {
          setTour(
            data ?
              {
                tour: data.tour ?? "",
                tour_id: data.tour_id,
                tour_canonid: data.tour_canonid ?? null,
              }
            : null,
          )
        }
      } catch (error) {
        console.error("Error in Echo tour info fetch:", error)
        if (!cancelled) setTour(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [tourId])

  return { loading, tour }
}
