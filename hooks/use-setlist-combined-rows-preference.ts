"use client"

import { useCallback, useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

export function useSetlistCombinedRowsPreference(profileId: string | undefined) {
  const [expandCombinedOnLoad, setExpandCombinedOnLoad] = useState(false)
  const [loading, setLoading] = useState(Boolean(profileId))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!profileId || !supabase) {
      setExpandCombinedOnLoad(false)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    supabase
      .from("profiles")
      .select("setlist_combined_rows_expanded_by_default")
      .eq("id", profileId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error || !data) {
          setExpandCombinedOnLoad(false)
        } else {
          const row = data as {
            setlist_combined_rows_expanded_by_default?: boolean | null
          }
          setExpandCombinedOnLoad(
            row.setlist_combined_rows_expanded_by_default === true,
          )
        }
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [profileId])

  const saveExpandCombinedOnLoad = useCallback(
    async (next: boolean) => {
      if (!profileId || !supabase) return false
      setSaving(true)
      const { error } = await supabase
        .from("profiles")
        .update({ setlist_combined_rows_expanded_by_default: next })
        .eq("id", profileId)
      setSaving(false)
      if (error) return false
      setExpandCombinedOnLoad(next)
      return true
    },
    [profileId],
  )

  return {
    expandCombinedOnLoad,
    saveExpandCombinedOnLoad,
    loading,
    saving,
  }
}
