"use client"

import { useCallback, useEffect, useState } from "react"

import { useAuth } from "@/components/auth-context"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import { supabase } from "@/lib/supabase"

const FALLBACK_LEAGUE = "2026 Summer [Second Leg]"

export function useEchoActiveLeague(revision = 0): {
  activeLeague: string
  loading: boolean
} {
  const [activeLeague, setActiveLeague] = useState<string>(FALLBACK_LEAGUE)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    setLoading(true)
    supabase
      .from("echo_settings")
      .select("active_league")
      .single()
      .then(({ data }) => {
        if (data?.active_league) setActiveLeague(data.active_league)
        setLoading(false)
      })
  }, [revision])

  return { activeLeague, loading }
}

export function useEchoSettingsAdmin(): {
  activeLeague: string
  loading: boolean
  saving: boolean
  saveError: string | null
  setActiveLeague: (league: string) => Promise<void>
} {
  const { session } = useAuth()
  const [activeLeague, setActiveLeagueState] = useState<string>(FALLBACK_LEAGUE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    supabase
      .from("echo_settings")
      .select("active_league")
      .single()
      .then(({ data }) => {
        if (data?.active_league) setActiveLeagueState(data.active_league)
        setLoading(false)
      })
  }, [])

  const setActiveLeague = useCallback(async (league: string) => {
    setSaving(true)
    setSaveError(null)
    const { error } = await invokeDproAdmin(session?.token, {
      action: "echo_settings_set_active_league",
      active_league: league,
    })
    if (error) {
      setSaveError(error)
    } else {
      setActiveLeagueState(league)
    }
    setSaving(false)
  }, [session?.token])

  return { activeLeague, loading, saving, saveError, setActiveLeague }
}
