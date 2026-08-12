"use client"

import { useEffect, useRef, useState } from "react"

import { supabase } from "@/lib/supabase"
import type { ShowData } from "@/types/admin"

const PAGE_SIZE = 1000

/**
 * Every show, for the admin show picker on `/archive/brains`.
 *
 * Gated on `enabled` and therefore never fetched for a setlister: their show comes
 * from their assignment, and the primary brains user is on a phone at a venue
 * where five paginated requests for 1,568 rows they cannot use would be pure cost.
 * Admins ask for it because they legitimately need to reach any show, including
 * old ones they are backfilling.
 *
 * Paginated the same way `useAdminSetlist` does, because PostgREST caps a single
 * response well below the full archive.
 */
export function useBrainsShows(enabled: boolean): {
  shows: ShowData[]
  loading: boolean
} {
  // null means "not fetched yet", which lets `loading` be derived rather than
  // tracked in a second state the effect has to set synchronously.
  const [shows, setShows] = useState<ShowData[] | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!enabled || startedRef.current || !supabase) return
    startedRef.current = true

    const client = supabase
    let cancelled = false

    const run = async () => {
      const all: ShowData[] = []
      let page = 0
      let more = true
      while (more && !cancelled) {
        const { data, error } = await client
          .from("shows")
          .select(
            "show_id, show_date, show_group, show_subvenue, show_venue_location, show_canonid",
          )
          .order("show_date", { ascending: false })
          .order("show_canonid", { ascending: false, nullsFirst: false })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
        if (error) break
        const rows = (data ?? []) as ShowData[]
        all.push(...rows)
        more = rows.length === PAGE_SIZE
        page += 1
      }
      if (!cancelled) setShows(all)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [enabled])

  return { shows: shows ?? [], loading: enabled && shows === null }
}
