"use client"

import { useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

export interface EchoTourOption {
  tour: string
  tour_id: string
  canonId: number | null
}

/** Returns all tours that have at least one setlist-game show, newest first. */
export function useEchoTours(): {
  loading: boolean
  tours: EchoTourOption[]
} {
  const [loading, setLoading] = useState(true)
  const [tours, setTours] = useState<EchoTourOption[]>([])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    async function fetch() {
      if (!supabase) return
      try {
        const { data: showsData } = await supabase
          .from("shows")
          .select("show_tour")
          .eq("show_issetlistgame", true)

        if (!showsData || showsData.length === 0) {
          setLoading(false)
          return
        }

        const uniqueTours = [...new Set(showsData.map((s) => s.show_tour))]

        const { data: toursData } = await supabase
          .from("tours")
          .select("tour, tour_id, tour_canonid")
          .in("tour", uniqueTours)

        if (!toursData) {
          setLoading(false)
          return
        }

        const result: EchoTourOption[] = toursData.map((t) => ({
          tour: t.tour,
          tour_id: t.tour_id,
          canonId: t.tour_canonid ?? null,
        }))

        result.sort((a, b) => {
          if (a.canonId != null && b.canonId != null) return b.canonId - a.canonId
          return b.tour.localeCompare(a.tour)
        })

        setTours(result)
      } finally {
        setLoading(false)
      }
    }

    void fetch()
  }, [])

  return { loading, tours }
}
