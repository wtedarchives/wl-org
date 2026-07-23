"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

const PAGE_SIZE = 1000

/**
 * Show IDs that appear in at least one `show_posters.show` jsonb array (with an image).
 */
export function useShowsWithPosters(): Set<string> {
  const [showIds, setShowIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    if (!supabase) {
      setShowIds(new Set())
      return
    }
    const client = supabase
    let cancelled = false

    void (async () => {
      try {
        const ids = new Set<string>()
        let page = 0
        let hasMore = true
        while (hasMore) {
          const { data, error } = await client
            .from("show_posters")
            .select("show")
            .not("image", "is", null)
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
          if (error) throw error
          if (data?.length) {
            for (const row of data) {
              const show = row.show
              if (!Array.isArray(show)) continue
              for (const id of show) {
                if (typeof id === "string" && id.trim()) ids.add(id.trim())
              }
            }
            page++
            hasMore = data.length === PAGE_SIZE
          } else {
            hasMore = false
          }
        }
        if (!cancelled) setShowIds(ids)
      } catch (e) {
        console.error("Error fetching shows with posters:", e)
        if (!cancelled) setShowIds(new Set())
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return showIds
}
