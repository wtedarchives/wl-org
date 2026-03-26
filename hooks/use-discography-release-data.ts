"use client"

import { useEffect, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

export type DiscographyReleaseRow = {
  uuid: string
  displayname: string
  name: string
  artist: string
  category: string
  artwork: string
  canon_id: number
  release_date: string | null
  coach_notes: string | null
}

export function useDiscographyReleaseData(uuid: string) {
  const [release, setRelease] = useState<DiscographyReleaseRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const client = supabase
    if (!client || !uuid) {
      setLoading(false)
      setError(true)
      return
    }

    let cancelled = false

    async function run(sb: SupabaseClient) {
      setLoading(true)
      setError(false)
      const { data, error: qError } = await sb
        .from("discography")
        .select(
          "uuid, displayname, name, artist, category, artwork, canon_id, release_date, coach_notes",
        )
        .eq("uuid", uuid)
        .single()

      if (cancelled) return

      if (qError || !data) {
        setRelease(null)
        setError(true)
      } else {
        setRelease(data as DiscographyReleaseRow)
        setError(false)
      }
      setLoading(false)
    }

    void run(client)
    return () => {
      cancelled = true
    }
  }, [uuid])

  return { release, loading, error }
}
