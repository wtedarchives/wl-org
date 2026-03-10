"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export interface VenueRow {
  subvenue: string
  subvenue_venue: string
  subvenue_venue_location: string
  venue_id: string
  goose_show_count: number
  other_show_count: number
}

export type VenueSortField =
  | "subvenue"
  | "subvenue_venue_location"
  | "goose_show_count"
  | "other_show_count"
export type VenueSortDirection = "asc" | "desc"

const VENUE_LOAD_STEPS = 2

export function useVenuesData(
  sortField: VenueSortField,
  sortDirection: VenueSortDirection,
) {
  const [venues, setVenues] = useState<VenueRow[]>([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const client = supabase
    if (!client) {
      setLoading(false)
      return
    }

    async function fetchVenues() {
      setLoading(true)
      setProgress(0)
      setError(null)
      try {
        setProgress(20)
        const { data, error: rpcError } = await client.rpc(
          "get_venues_with_show_counts",
          {
            sort_field: sortField,
            sort_direction: sortDirection,
          },
        )
        setProgress(90)
        if (rpcError) throw rpcError
        setVenues((data as VenueRow[]) ?? [])
        setProgress(100)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load venues")
        setVenues([])
      } finally {
        setLoading(false)
      }
    }

    fetchVenues()
  }, [sortField, sortDirection])

  return { venues, loading, progress, error }
}
