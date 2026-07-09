import { useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

interface ShowSlice {
  show_id: string
}

function showIdsKey(filteredShows: ShowSlice[]): string {
  return filteredShows.map((s) => s.show_id).join("\0")
}

export function useAttendeeData(filteredShows: ShowSlice[]) {
  const [attendeeCounts, setAttendeeCounts] = useState<Record<string, number>>(
    {},
  )
  const idsKey = showIdsKey(filteredShows)

  useEffect(() => {
    const showIds = idsKey ? idsKey.split("\0") : []

    async function fetchAttendeeCounts() {
      if (!supabase) {
        setAttendeeCounts((prev) =>
          Object.keys(prev).length === 0 ? prev : {},
        )
        return
      }
      if (showIds.length === 0) {
        setAttendeeCounts((prev) =>
          Object.keys(prev).length === 0 ? prev : {},
        )
        return
      }

      try {
        const client = supabase

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
        showIds.forEach((showId) => {
          counts[showId] = 0
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
  }, [idsKey])

  return { attendeeCounts }
}
