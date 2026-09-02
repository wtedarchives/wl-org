"use client"

import { useEffect, useState } from "react"

import { useAuth } from "@/components/auth-context"
import { deriveEchoPicksStatus } from "@/lib/echo-picks-status"
import { supabase } from "@/lib/supabase"

export type EchoNextShow = {
  showId: string
  dateLong: string
  venue: string
  city: string
  showTime: string
  players: number
  countdown: string
  picksOpen: boolean
  submissionId: string | null
}

function formatEchoShowDateLong(dateInput: string): string {
  const date = new Date(
    dateInput.includes("T") ? dateInput : `${dateInput}T00:00:00Z`,
  )
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

function withCountdown(
  show: Omit<EchoNextShow, "countdown" | "picksOpen">,
): EchoNextShow {
  return { ...show, ...deriveEchoPicksStatus(show.showTime) }
}

export function useEchoNextShow(
  league: string,
  refreshToken = 0,
): {
  loading: boolean
  show: EchoNextShow | null
} {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [show, setShow] = useState<EchoNextShow | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchNextShow() {
      if (!supabase) {
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        const { data, error } = await supabase
          .from("shows")
          .select(
            "show_id, show_date, show_time, show_subvenue, show_venue_location",
          )
          .eq("show_tour", league)
          .eq("show_issetlistgame", true)
          .or("show_scored.eq.false,show_scored.is.null")
          .order("show_canonid", { ascending: true })
          .limit(1)
          .maybeSingle()

        if (error) {
          console.error("Error fetching Echo next show:", error.message)
          if (!cancelled) {
            setShow(null)
            setLoading(false)
          }
          return
        }

        if (!data) {
          if (!cancelled) {
            setShow(null)
            setLoading(false)
          }
          return
        }

        const { count, error: countError } = await supabase
          .from("setlist_game_submissions")
          .select("*", { count: "exact", head: true })
          .eq("show_id", data.show_id)

        if (countError) {
          console.error(
            "Error fetching Echo next show players:",
            countError.message,
          )
        }

        let submissionId: string | null = null
        if (session?.profileId) {
          const { data: submission, error: submissionError } = await supabase
            .from("setlist_game_submissions")
            .select("submission_id")
            .eq("user_id", session.profileId)
            .eq("show_id", data.show_id)
            .maybeSingle()

          if (submissionError) {
            console.error(
              "Error fetching Echo next show submission:",
              submissionError.message,
            )
          } else {
            submissionId = submission?.submission_id ?? null
          }
        }

        if (cancelled) return

        setShow(
          withCountdown({
            showId: data.show_id,
            dateLong: formatEchoShowDateLong(data.show_date ?? ""),
            venue: data.show_subvenue ?? "",
            city: data.show_venue_location ?? "",
            showTime: data.show_time ?? "",
            players: count ?? 0,
            submissionId,
          }),
        )
      } catch (error) {
        console.error("Error in Echo next show fetch:", error)
        if (!cancelled) setShow(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchNextShow()
    return () => {
      cancelled = true
    }
  }, [league, refreshToken, session?.profileId])

  useEffect(() => {
    if (!show?.picksOpen) return

    const timerId = window.setInterval(() => {
      setShow((prev) => (prev ? withCountdown(prev) : prev))
    }, 1000)

    return () => window.clearInterval(timerId)
  }, [show?.picksOpen, show?.showTime])

  return { loading, show }
}
