"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { WysteriaSession } from "@/lib/jwt"

export function useSetlistAttendance(
  showId: string | undefined,
  session: WysteriaSession | null,
  onAttendChange?: (newCount: number) => void
) {
  const [attended, setAttended] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    if (!showId || !session || !supabase) {
      setAttended(false)
      setLoading(false)
      return
    }
    const client = supabase
    const userId = session?.profileId
    async function check() {
      const { data, error } = await client
        .from("user_attended_shows")
        .select("id")
        .eq("show_id", showId)
        .eq("user_id", userId)
        .maybeSingle()
      if (!error) setAttended(!!data)
      setLoading(false)
    }
    check()
  }, [showId, session?.profileId])

  const toggle = useCallback(async () => {
    if (!showId || !session || !supabase) return
    const client = supabase
    const userId = session?.profileId
    setToggling(true)
    try {
      if (attended) {
        await client
          .from("user_attended_shows")
          .delete()
          .eq("show_id", showId)
          .eq("user_id", userId)
        setAttended(false)
        const { count } = await client
          .from("user_attended_shows")
          .select("*", { count: "exact", head: true })
          .eq("show_id", showId)
        onAttendChange?.(count ?? 0)
      } else {
        await client.from("user_attended_shows").insert({
          show_id: showId,
          user_id: userId,
        })
        setAttended(true)
        const { count } = await client
          .from("user_attended_shows")
          .select("*", { count: "exact", head: true })
          .eq("show_id", showId)
        onAttendChange?.(count ?? 0)
      }
    } catch (err) {
      console.error("Error toggling attendance:", err)
    } finally {
      setToggling(false)
    }
  }, [showId, session, attended, onAttendChange])

  return { attended, loading, toggling, toggle }
}
