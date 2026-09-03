"use client"

import { useCallback, useEffect, useState } from "react"

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
  setActiveLeague: (league: string) => Promise<void>
} {
  const [activeLeague, setActiveLeagueState] = useState<string>(FALLBACK_LEAGUE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
    if (!supabase) return
    setSaving(true)
    const { error } = await supabase
      .from("echo_settings")
      .update({ active_league: league })
      .eq("id", true)
    if (!error) setActiveLeagueState(league)
    setSaving(false)
  }, [])

  return { activeLeague, loading, saving, setActiveLeague }
}
