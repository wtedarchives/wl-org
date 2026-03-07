"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export function useSetlistYearId(showDate: string | null | undefined): string | null {
  const [yearId, setYearId] = useState<string | null>(null)
  const year = showDate ? showDate.slice(0, 4) : null

  useEffect(() => {
    if (!year || !supabase) {
      setYearId(null)
      return
    }
    const client = supabase
    async function fetchYearId() {
      const { data, error } = await client
        .from("years")
        .select("year_id")
        .eq("year", year)
        .limit(1)
        .maybeSingle()
      if (!error && data?.year_id) setYearId(data.year_id)
      else setYearId(null)
    }
    fetchYearId()
  }, [year])

  return yearId
}

/** Returns year_id for a given year string (e.g. "2024"). */
export function useYearIdFromYear(
  year: string | null | undefined,
): string | null {
  const [yearId, setYearId] = useState<string | null>(null)

  useEffect(() => {
    if (!year || !supabase || year === "Unknown") {
      setYearId(null)
      return
    }
    const client = supabase
    async function fetchYearId() {
      const { data, error } = await client
        .from("years")
        .select("year_id")
        .eq("year", year)
        .limit(1)
        .maybeSingle()
      if (!error && data?.year_id) setYearId(data.year_id)
      else setYearId(null)
    }
    fetchYearId()
  }, [year])

  return yearId
}
