import { useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

interface ShowSlice {
  show_id: string
}

export function useAttendeeData(filteredShows: ShowSlice[]) {
  const [attendeeCounts, setAttendeeCounts] = useState<Record<string, number>>(
    {},
  )

  useEffect(() => {
    async function fetchAttendeeCounts() {
      if (!supabase) {
        setAttendeeCounts({})
        return
      }
      if (filteredShows.length === 0) {
        setAttendeeCounts({})
        return
      }

      try {
        const client = supabase
        const showIds = filteredShows.map((s) => s.show_id)

        const { count, error: countError } = await client
          .from("user_attended_shows")
          .select("*", { count: "exact", head: true })
          .in("show_id", showIds)

        if (countError) throw countError

        const total = count ?? 0
        const batchSize = 1000
        const totalBatches = Math.ceil(total / batchSize)
        let allData: { show_id: string }[] = []

        for (let i = 0; i < totalBatches; i += 1) {
          const start = i * batchSize
          const end = Math.min(start + batchSize - 1, total - 1)

          const { data, error } = await client
            .from("user_attended_shows")
            .select("show_id")
            .in("show_id", showIds)
            .range(start, end)

          if (error) throw error
          if (data) {
            allData = allData.concat(data as { show_id: string }[])
          }
        }

        const counts: Record<string, number> = {}
        filteredShows.forEach((show) => {
          counts[show.show_id] = 0
        })

        allData.forEach((record) => {
          counts[record.show_id] = (counts[record.show_id] || 0) + 1
        })

        setAttendeeCounts(counts)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching attendee counts:", err)
      }
    }

    fetchAttendeeCounts()
  }, [filteredShows])

  return { attendeeCounts }
}

