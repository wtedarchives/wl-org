"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export interface ShowChangeRow {
  show_change_uuid: string
  show_id: string
  change_type: string
  change_order: number | null
  change: string
}

export function useShowChanges(showId: string | undefined) {
  const [changes, setChanges] = useState<ShowChangeRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!showId || !supabase) {
      setChanges([])
      return
    }
    const client = supabase
    setLoading(true)
    client
      .from("show_changes")
      .select("show_change_uuid, show_id, change_type, change_order, change")
      .eq("show_id", showId)
      .order("change_order", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setChanges(data as ShowChangeRow[])
        else setChanges([])
        setLoading(false)
      })
  }, [showId])

  return { changes, loading }
}
