"use client"

import { useCallback, useEffect, useState } from "react"

import { useAuth } from "@/components/auth-context"
import type { EchoLiveEntry, EchoLivePickRow } from "@/components/echo/echo-live-data"
import { supabase } from "@/lib/supabase"

function compareEchoSetKey(a: string, b: string): number {
  const aEncore = /^E/i.test(a)
  const bEncore = /^E/i.test(b)
  if (aEncore !== bEncore) return aEncore ? 1 : -1
  return (
    Number.parseInt(a.replace(/^E/i, ""), 10) -
    Number.parseInt(b.replace(/^E/i, ""), 10)
  )
}

export type EchoLiveShowInfo = {
  date: string
  venue: string
  city: string
  players: number
  scored: boolean
  setlistComplete: boolean
  showTime: string
  showTour: string
  showDetail: string | null
}

export function useEchoLiveShow(showId: string | null): {
  loading: boolean
  signedIn: boolean
  show: EchoLiveShowInfo | null
  entries: EchoLiveEntry[]
  picks: EchoLivePickRow[]
  complete: boolean
} {
  const { session } = useAuth()
  const signedIn = Boolean(session?.profileId)
  const [loading, setLoading] = useState(true)
  const [show, setShow] = useState<EchoLiveShowInfo | null>(null)
  const [entries, setEntries] = useState<EchoLiveEntry[]>([])
  const [picks, setPicks] = useState<EchoLivePickRow[]>([])

  const load = useCallback(async () => {
    if (!showId || !supabase) {
      setLoading(false)
      return
    }

    try {
      const [{ data: showRow, error: showError }, { data: entryRows, error: entryError }] =
        await Promise.all([
          supabase
            .from("shows")
            .select(
              "show_date, show_subvenue, show_venue_location, show_scored, show_setlistcomplete, show_time, show_tour, show_detail",
            )
            .eq("show_id", showId)
            .maybeSingle(),
          supabase
            .from("setlist_entries")
            .select(
              "entry_id, entry_song, entry_set, entry_setnum, entry_placement, entry_short, entry_segue",
            )
            .eq("entry_show", showId)
            .order("entry_set", { ascending: true })
            .order("entry_setnum", { ascending: true }),
        ])

      if (showError) {
        console.error("Error fetching Echo live show:", showError.message)
      }
      if (entryError) {
        console.error("Error fetching Echo live setlist:", entryError.message)
      }

      const { count, error: countError } = await supabase
        .from("setlist_game_submissions")
        .select("*", { count: "exact", head: true })
        .eq("show_id", showId)

      if (countError) {
        console.error("Error fetching Echo live players:", countError.message)
      }

      if (showRow) {
        setShow({
          date: showRow.show_date ?? "",
          venue: showRow.show_subvenue ?? "",
          city: showRow.show_venue_location ?? "",
          players: count ?? 0,
          scored: Boolean(showRow.show_scored),
          setlistComplete: Boolean(showRow.show_setlistcomplete),
          showTime: showRow.show_time ?? "",
          showTour: showRow.show_tour ?? "",
          showDetail: showRow.show_detail ?? null,
        })
      } else {
        setShow(null)
      }

      setEntries(
        (entryRows ?? [])
          .map((row) => ({
            entry_id: row.entry_id,
            entry_song: row.entry_song ?? "",
            entry_set: String(row.entry_set ?? ""),
            entry_setnum: row.entry_setnum ?? 0,
            entry_placement: row.entry_placement ?? null,
            entry_short: row.entry_short ?? null,
            entry_segue: row.entry_segue ?? null,
          }))
          .sort(
            (a, b) =>
              compareEchoSetKey(a.entry_set, b.entry_set) ||
              a.entry_setnum - b.entry_setnum,
          ),
      )

      if (!session?.profileId) {
        setPicks([])
        return
      }

      const { data: submission, error: submissionError } = await supabase
        .from("setlist_game_submissions")
        .select("submission_id")
        .eq("user_id", session.profileId)
        .eq("show_id", showId)
        .maybeSingle()

      if (submissionError) {
        console.error(
          "Error fetching Echo live submission:",
          submissionError.message,
        )
        setPicks([])
        return
      }

      if (!submission) {
        setPicks([])
        return
      }

      const { data: pickRows, error: picksError } = await supabase
        .from("setlist_game_picks")
        .select(
          "song, set, setnum, placement, score, result, showopener_correct, showcloser_correct",
        )
        .eq("submission_id", submission.submission_id)
        .order("set", { ascending: true })
        .order("setnum", { ascending: true })

      if (picksError) {
        console.error("Error fetching Echo live picks:", picksError.message)
        setPicks([])
        return
      }

      setPicks(
        (pickRows ?? [])
          .map((row) => ({
            song: row.song ?? "",
            set: String(row.set ?? ""),
            setnum: row.setnum ?? 0,
            placement: row.placement ?? null,
            score: row.score ?? null,
            result: row.result ?? null,
            showopener_correct: Boolean(row.showopener_correct),
            showcloser_correct: Boolean(row.showcloser_correct),
          }))
          .sort(
            (a, b) =>
              compareEchoSetKey(a.set, b.set) || a.setnum - b.setnum,
          ),
      )
    } catch (error) {
      console.error("Error in Echo live show fetch:", error)
    } finally {
      setLoading(false)
    }
  }, [session?.profileId, showId])

  useEffect(() => {
    setLoading(true)
    void load()
  }, [load])

  const complete = Boolean(show?.scored || show?.setlistComplete)

  useEffect(() => {
    if (!showId || !supabase || complete) return

    const channel = supabase
      .channel(`echo-live:${showId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "setlist_entries",
          filter: `entry_show=eq.${showId}`,
        },
        () => {
          void load()
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "shows",
          filter: `show_id=eq.${showId}`,
        },
        () => {
          void load()
        },
      )
      .subscribe()

    const onVisible = () => {
      if (document.visibilityState === "visible") void load()
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      document.removeEventListener("visibilitychange", onVisible)
      void supabase?.removeChannel(channel)
    }
  }, [complete, load, showId])

  useEffect(() => {
    if (!showId || complete) return
    const timerId = window.setInterval(() => {
      void load()
    }, 15000)
    return () => window.clearInterval(timerId)
  }, [complete, load, showId])

  return { loading, signedIn, show, entries, picks, complete }
}
