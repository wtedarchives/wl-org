"use client"

import { useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

/** Largest `shows.show_canonid` among rows where it is set (denominator for “SHOW n OF m”). */
export function useMaxShowCanonId() {
  const [maxCanonId, setMaxCanonId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    const client = supabase
    let cancelled = false

    async function fetchMax() {
      try {
        const { data, error } = await client
          .from("shows")
          .select("show_canonid")
          .not("show_canonid", "is", null)
          .order("show_canonid", { ascending: false })
          .limit(1)
          .maybeSingle()

        if (cancelled) return
        if (!error && data?.show_canonid != null) {
          setMaxCanonId(data.show_canonid as number)
        } else {
          setMaxCanonId(null)
        }
      } catch {
        if (!cancelled) setMaxCanonId(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchMax()
    return () => {
      cancelled = true
    }
  }, [])

  return { maxCanonId, loading }
}
