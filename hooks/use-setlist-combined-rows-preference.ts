"use client"

import { useCallback, useEffect, useState } from "react"

import { invokeUserProfilePreferences } from "@/lib/user-profile-preferences-edge"
import { supabase } from "@/lib/supabase"

export function useSetlistCombinedRowsPreference(
  profileId: string | undefined,
  accessToken: string | undefined,
) {
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
      if (!profileId || !accessToken) return false
      setSaving(true)
      const result = await invokeUserProfilePreferences(accessToken, {
        setlist_combined_rows_expanded_by_default: next,
      })
      setSaving(false)
      if (!result.ok) return false
      setExpandCombinedOnLoad(next)
      return true
    },
    [profileId, accessToken],
  )

  return {
    expandCombinedOnLoad,
    saveExpandCombinedOnLoad,
    loading,
    saving,
  }
}
