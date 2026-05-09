"use client"

import { useEffect, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"

import {
  type DiscographyArchiveIndexRow,
} from "@/lib/discography-archive-index"
import { DISCOGRAPHY_PUBLIC_CATEGORIES } from "@/lib/discography-public"
import { supabase } from "@/lib/supabase"

export function useDiscographyArchiveIndexData(): {
  items: DiscographyArchiveIndexRow[]
  loading: boolean
  error: boolean
  progress: number
} {
  const [items, setItems] = useState<DiscographyArchiveIndexRow[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const client = supabase
    if (!client) {
      setLoading(false)
      setFetchError(true)
      return
    }

    let cancelled = false

    async function load(sb: SupabaseClient) {
      setLoading(true)
      setFetchError(false)
      setProgress(10)
      const cats = [...DISCOGRAPHY_PUBLIC_CATEGORIES]
      const { data, error } = await sb
        .from("discography")
        .select("uuid, name, displayname, artwork, canon_id, category")
        .in("category", cats)
        .order("canon_id", { ascending: true })

      if (cancelled) return

      setProgress(100)
      if (error) {
        console.error("Error loading discography:", error)
        setFetchError(true)
        setItems([])
      } else {
        setItems((data ?? []) as DiscographyArchiveIndexRow[])
      }
      setLoading(false)
    }

    void load(client)
    return () => {
      cancelled = true
    }
  }, [])

  return { items, loading, error: fetchError, progress }
}
