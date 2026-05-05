"use client"

import { useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

export type WlHomePersonnelCatalogRow = {
  guest_id: string
  guest: string
  guest_instrument: string | null
}

const CATEGORIES_FETCH = [
  { key: "current", category: "Goose (current)" },
  { key: "former", category: "Goose (former)" },
  { key: "guests", category: "Guest" },
  { key: "groups", category: "Group" },
] as const

const EMPTY: Record<(typeof CATEGORIES_FETCH)[number]["key"], WlHomePersonnelCatalogRow[]> =
  {
    current: [],
    former: [],
    guests: [],
    groups: [],
  }

/**
 * Personnel index rows keyed like {@link components/dpro/personnel/personnel-content}.
 */
export function useWlHomePersonnelCatalog(enabled: boolean) {
  const [byKey, setByKey] =
    useState<Record<(typeof CATEGORIES_FETCH)[number]["key"], WlHomePersonnelCatalogRow[]>>(
      EMPTY,
    )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      setError(false)
      setByKey(EMPTY)
      return
    }
    if (!supabase) {
      setLoading(false)
      setError(true)
      return
    }
    const db = supabase

    async function fetchData() {
      setLoading(true)
      setError(false)
      try {
        const next: typeof EMPTY = {
          current: [],
          former: [],
          guests: [],
          groups: [],
        }
        for (const { key, category } of CATEGORIES_FETCH) {
          const { data, error: fetchError } = await db
            .from("guests")
            .select("guest_id, guest, guest_instrument")
            .eq("guest_category", category)
            .order("guest", { ascending: true })
          if (fetchError) throw fetchError
          next[key] = (data ?? []).map((row) => ({
            guest_id: row.guest_id,
            guest: row.guest,
            guest_instrument:
              key === "groups" ? null : row.guest_instrument ?? null,
          }))
        }
        setByKey(next)
      } catch {
        setByKey(EMPTY)
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    void fetchData()
  }, [enabled])

  return { byKey, loading, error }
}
