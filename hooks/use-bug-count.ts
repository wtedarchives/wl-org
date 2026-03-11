"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

/**
 * Fetches the count of open (unresolved) bugs for the Admin sidebar badge.
 */
export function useBugCount(): number | null {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    if (!supabase) {
      setCount(null)
      return
    }
    const sb = supabase

    async function fetchOpenBugCount() {
      try {
        const { count: openCount, error } = await sb
          .from("bugs")
          .select("*", { count: "exact", head: true })
          .eq("bug_completion", false)

        if (error) {
          setCount(null)
          return
        }
        setCount(openCount ?? 0)
      } catch {
        setCount(null)
      }
    }

    fetchOpenBugCount()

    const channel = sb
      .channel("bugs-count-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bugs" },
        () => {
          fetchOpenBugCount()
        }
      )
      .subscribe()

    return () => {
      sb.removeChannel(channel)
    }
  }, [])

  return count
}
