"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export interface List {
  list_id: string
  list_name: string
  list_description: string | null
  list_category: string
  list_order: number
}

export function useListsData() {
  const [songLists, setSongLists] = useState<List[]>([])
  const [showLists, setShowLists] = useState<List[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const client = supabase
    if (!client) {
      setLoading(false)
      return
    }

    async function fetchLists(sb: NonNullable<typeof supabase>) {
      setLoading(true)
      setError(null)
      try {
        const [songRes, showRes] = await Promise.all([
          sb
            .from("lists")
            .select("list_id, list_name, list_description, list_category, list_order")
            .eq("list_category", "songs")
            .order("list_order", { ascending: true }),
          sb
            .from("lists")
            .select("list_id, list_name, list_description, list_category, list_order")
            .eq("list_category", "shows")
            .order("list_order", { ascending: true }),
        ])

        if (songRes.error) throw songRes.error
        if (showRes.error) throw showRes.error

        setSongLists((songRes.data as List[]) ?? [])
        setShowLists((showRes.data as List[]) ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load lists")
        setSongLists([])
        setShowLists([])
      } finally {
        setLoading(false)
      }
    }

    fetchLists(client)
  }, [])

  return { songLists, showLists, loading, error }
}
