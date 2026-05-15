"use client"

import { useCallback, useEffect, useState } from "react"

import { fetchProgramDirectorCatalogRows } from "@/lib/fetch-program-director-catalog"
import type { ProgramDirectorCatalogRow } from "@/lib/fetch-program-director-catalog"
import { supabase } from "@/lib/supabase"

export type { ProgramDirectorCatalogRow } from "@/lib/fetch-program-director-catalog"

export function useProgramDirectorCatalogData() {
  const [rows, setRows] = useState<ProgramDirectorCatalogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      setError(true)
      setRows([])
      return
    }
    setLoading(true)
    setError(false)
    try {
      const data = await fetchProgramDirectorCatalogRows(supabase)
      setRows(data)
    } catch (e) {
      console.error("program director catalog: load", e)
      setError(true)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { rows, loading, error, reload: load }
}
