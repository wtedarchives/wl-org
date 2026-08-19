"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"

import type { SubmissionDetails } from "@/hooks/use-setlist-game-show-data"
import {
  useTopClosersData,
  useTopOpenersData,
  useTopSongsData,
} from "@/hooks/use-top-songs-data"
import type { UserPick } from "@/hooks/use-user-picks"
import { supabase } from "@/lib/supabase"

export const ECHO_EMPTY_SUBMISSION_DETAILS: SubmissionDetails = {
  totalScore: 0,
  songsPicked: 0,
  songsPlayed: 0,
  setlist: [],
}

export async function fetchEchoPicksBySubmissionId(
  submissionId: string,
): Promise<UserPick[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from("setlist_game_picks")
    .select(
      "song, set, setnum, placement, score, result, showcloser_correct, showopener_correct",
    )
    .eq("submission_id", submissionId)
    .order("setnum", { ascending: true })
  return data ?? []
}

export function useEchoFirstTime(userId: string | undefined): boolean {
  const [firstTime, setFirstTime] = useState(false)

  useEffect(() => {
    if (!userId || !supabase) {
      setFirstTime(false)
      return
    }
    let cancelled = false
    void supabase
      .from("setlist_game_submissions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .then(({ count }) => {
        if (!cancelled) setFirstTime((count ?? 0) === 0)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  return firstTime
}

export function EchoOfAShowCrowdData({
  showId,
  children,
}: {
  showId: string
  children: (data: {
    topSongs: ReturnType<typeof useTopSongsData>
    topOpeners: ReturnType<typeof useTopOpenersData>
    topClosers: ReturnType<typeof useTopClosersData>
  }) => ReactNode
}) {
  const topSongs = useTopSongsData(showId)
  const topOpeners = useTopOpenersData(showId)
  const topClosers = useTopClosersData(showId)
  return children({ topSongs, topOpeners, topClosers })
}
