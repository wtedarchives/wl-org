"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export function useSetlistScan(showId: string | undefined) {
  const [setlistUrl, setSetlistUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!showId || !supabase) {
      setLoading(false)
      return
    }
    const client = supabase
    async function fetchSetlistUrl() {
      try {
        const { data, error } = await client
          .from("show_setlists")
          .select("setlist_url")
          .eq("show_id", showId)
          .maybeSingle()
        if (error) throw error
        const url = (data as { setlist_url: string } | null)?.setlist_url ?? null
        setSetlistUrl(url && url.trim() ? url : null)
      } catch {
        setSetlistUrl(null)
      } finally {
        setLoading(false)
      }
    }
    fetchSetlistUrl()
  }, [showId])

  return { setlistUrl, loading }
}
