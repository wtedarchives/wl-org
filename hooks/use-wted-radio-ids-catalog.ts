"use client"

import {
  startTransition,
  useCallback,
  useEffect,
  useState,
} from "react"
import { supabase } from "@/lib/supabase"
import {
  clearWtedRadioCatalogSessionCache,
  readWtedRadioCatalogSessionCache,
  writeWtedRadioCatalogSessionCache,
} from "@/lib/wted-radio-catalog-session-cache"
import {
  WTED_RADIO_IDS_PAGE_SIZE,
  type WtedRadioIdRow,
} from "@/lib/wted-radio-ids-sync"

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

export function useWtedRadioIdsCatalog(enabled: boolean) {
  const [rows, setRows] = useState<WtedRadioIdRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** Bumps when `reload()` clears session cache so the load effect runs again. */
  const [catalogFetchKey, setCatalogFetchKey] = useState(0)

  const loadFromNetwork = useCallback(async (signal: AbortSignal) => {
    if (!supabase) {
      if (!signal.aborted) {
        setError("Database client unavailable")
        setLoading(false)
      }
      return
    }
    if (!signal.aborted) {
      setError(null)
      setLoading(true)
    }
    try {
      const acc: WtedRadioIdRow[] = []
      let from = 0
      for (;;) {
        if (signal.aborted) return
        const { data, error: pageError } = await supabase
          .from("wted_radio_ids")
          .select("uuid, radio_id, track_artist, track_title, status, artwork")
          .order("track_title", { ascending: true, nullsFirst: false })
          .range(from, from + WTED_RADIO_IDS_PAGE_SIZE - 1)
        if (signal.aborted) return
        if (pageError) throw pageError
        const chunk = (data ?? []) as WtedRadioIdRow[]
        acc.push(...chunk)
        if (chunk.length < WTED_RADIO_IDS_PAGE_SIZE) break
        from += WTED_RADIO_IDS_PAGE_SIZE
        await yieldToMain()
      }
      if (signal.aborted) return
      writeWtedRadioCatalogSessionCache(acc)
      startTransition(() => {
        setRows(acc)
      })
    } catch (e) {
      if (signal.aborted) return
      setError(
        e instanceof Error ? e.message : "Failed to load WTED radio catalog",
      )
      startTransition(() => {
        setRows([])
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    const cached = readWtedRadioCatalogSessionCache()
    if (cached && cached.length > 0) {
      startTransition(() => {
        setRows(cached)
      })
      setError(null)
      setLoading(false)
      return
    }

    const ac = new AbortController()
    void loadFromNetwork(ac.signal)
    return () => {
      ac.abort()
    }
  }, [enabled, loadFromNetwork, catalogFetchKey])

  const reload = useCallback(() => {
    clearWtedRadioCatalogSessionCache()
    startTransition(() => setRows([]))
    setCatalogFetchKey((k) => k + 1)
  }, [])

  return { rows, loading, error, reload }
}
