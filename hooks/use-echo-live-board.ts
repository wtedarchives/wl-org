"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import type { GameShow } from "@/hooks/use-game-shows"
import type { UserPick } from "@/hooks/use-user-picks"
import type { EchoActualEntry } from "@/lib/echo-of-a-show-live"
import { supabase } from "@/lib/supabase"

export type EchoLiveBoard = {
  actual: EchoActualEntry[]
  picks: UserPick[]
  scores: { userId: string; score: number }[]
  youScore: number
}

const emptyBoard: EchoLiveBoard = {
  actual: [],
  picks: [],
  scores: [],
  youScore: 0,
}

export function useEchoLiveBoard(
  showId: string | undefined,
  userId: string | undefined,
): { loading: boolean; board: EchoLiveBoard; refresh: () => Promise<void> } {
  const [loading, setLoading] = useState(true)
  const [board, setBoard] = useState<EchoLiveBoard>(emptyBoard)

  const refresh = useCallback(async () => {
    if (!showId || !supabase) {
      setBoard(emptyBoard)
      setLoading(false)
      return
    }
    const [{ data: entries }, { data: subs }] = await Promise.all([
      supabase
        .from("setlist_entries")
        .select(
          "entry_id, entry_song, entry_set, entry_setnum, entry_placement, entry_new",
        )
        .eq("entry_show", showId)
        .order("entry_set", { ascending: true })
        .order("entry_setnum", { ascending: true }),
      supabase
        .from("setlist_game_submissions")
        .select("user_id, submission_id, score_provisional")
        .eq("show_id", showId),
    ])
    const actual = (entries ?? []) as EchoActualEntry[]
    const scores = (subs ?? []).map((row) => ({
      userId: row.user_id as string,
      score: row.score_provisional ?? 0,
    }))
    const own = userId
      ? (subs ?? []).find((row) => row.user_id === userId)
      : undefined
    let picks: UserPick[] = []
    if (own?.submission_id) {
      const { data: pickRows } = await supabase
        .from("setlist_game_picks")
        .select(
          "song, set, setnum, placement, score, result, showcloser_correct, showopener_correct",
        )
        .eq("submission_id", own.submission_id)
        .order("setnum", { ascending: true })
      picks = pickRows ?? []
    }
    const youScore = own?.score_provisional ?? 0
    setBoard({ actual, picks, scores, youScore })
    setLoading(false)
  }, [showId, userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!showId || !supabase) return
    const client = supabase
    const channel = client
      .channel(`echo-live-${showId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "setlist_entries",
          filter: `entry_show=eq.${showId}`,
        },
        () => {
          void refresh()
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "setlist_game_submissions",
          filter: `show_id=eq.${showId}`,
        },
        () => {
          void refresh()
        },
      )
      .subscribe()
    return () => {
      void client.removeChannel(channel)
    }
  }, [showId, refresh])

  return { loading, board, refresh }
}

export function useEchoRunningShow(
  gameShows: GameShow[],
): GameShow | null {
  const [runningId, setRunningId] = useState<string | null>(null)

  const candidates = useMemo(
    () =>
      gameShows.filter(
        (show) => !show.show_scored && show.isSelectionClosed,
      ),
    [gameShows],
  )

  useEffect(() => {
    if (!supabase || candidates.length === 0) {
      setRunningId(null)
      return
    }
    let cancelled = false
    const ids = candidates.map((show) => show.show_id)
    void supabase
      .from("setlist_entries")
      .select("entry_show")
      .in("entry_show", ids)
      .then(({ data }) => {
        if (cancelled) return
        const withSongs = new Set((data ?? []).map((row) => row.entry_show))
        const match = [...candidates]
          .reverse()
          .find((show) => withSongs.has(show.show_id))
        setRunningId(match?.show_id ?? null)
      })
    return () => {
      cancelled = true
    }
  }, [candidates])

  return candidates.find((show) => show.show_id === runningId) ?? null
}
