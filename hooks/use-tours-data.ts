import { useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

export interface TourCount {
  tour_count: string
  tour_canonid: number
  tour_id: string
  tour: string
  color: string
}

const TOUR_COLORS = [
  "#0bacc9",
  "#e4482f",
  "#fcb924",
  "#67a343",
  "#9e598f",
  "#be823a",
  "#f58ba2",
  "#7b6e66",
  "#ec7523",
  "#050608",
  "#fee4d3",
  "#5a2c08",
  "#8ecfbb",
]

export function useToursData(currentYear: string) {
  const [tours, setTours] = useState<TourCount[]>([])

  useEffect(() => {
    if (!currentYear) return
    if (!supabase) {
      setTours([])
      return
    }

    const client = supabase
    async function fetchTours() {
      try {
        const { data, error } = await client
          .from("shows")
          .select(
            `
            show_tour,
            tours(tour,tour_canonid,tour_id)
          `,
          )
          .eq("show_year", currentYear)

        if (error) throw error

        const tourCounts: Record<
          string,
          { count: number; tour_canonid: number | null; tour_id: string | null; tour: string }
        > = {}

        ;(data ?? []).forEach((item: any) => {
          const key = item.show_tour as string
          if (!key) return
          if (tourCounts[key]) {
            tourCounts[key].count += 1
          } else {
            tourCounts[key] = {
              count: 1,
              tour_canonid: item.tours?.tour_canonid ?? null,
              tour_id: item.tours?.tour_id ?? null,
              tour: item.show_tour,
            }
          }
        })

        const transformedTours: TourCount[] = Object.entries(tourCounts).map(
          ([tourName, { count, tour_canonid, tour_id, tour }], index) => ({
            tour_count: `${tourName} (${count})`,
            tour_canonid: tour_canonid ?? 0,
            tour_id: tour_id ?? "",
            tour: tour ?? tourName,
            color: TOUR_COLORS[index % TOUR_COLORS.length],
          }),
        )

        const sortedTours = transformedTours.sort(
          (a, b) => a.tour_canonid - b.tour_canonid,
        )

        setTours(sortedTours)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching tours:", err)
        setTours([])
      }
    }

    fetchTours()
  }, [currentYear])

  return { tours }
}

