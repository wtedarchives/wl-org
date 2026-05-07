"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

export interface UserPick {
  song: string
  set: string
  setnum: number
  placement?: string
  score?: number
  result?: string
  showcloser_correct?: boolean
  showopener_correct?: boolean
}

export function useUserPicks(): {
  userPicks: UserPick[]
  loadingPicks: boolean
  fetchUserPicks: (showId: string, user: User) => Promise<UserPick[]>
  resetPicks: () => void
  setUserPicks: React.Dispatch<React.SetStateAction<UserPick[]>>
} {
  const [userPicks, setUserPicks] = useState<UserPick[]>([])
  const [loadingPicks, setLoadingPicks] = useState(false)

  const fetchUserPicks = async (
    showId: string,
    user: User
  ): Promise<UserPick[]> => {
    if (!user || !supabase) return []

    try {
      setLoadingPicks(true)

      const { data: submissionData, error: submissionError } = await supabase
        .from("setlist_game_submissions")
        .select("submission_id")
        .eq("user_id", session?.profileId)
        .eq("show_id", showId)
        .single()

      if (submissionError) {
        if (submissionError.code !== "PGRST116") {
          console.error("Error fetching submission:", submissionError)
        }
        return []
      }

      if (!submissionData) return []

      const { data: picksData, error: picksError } = await supabase
        .from("setlist_game_picks")
        .select("song, set, setnum, placement")
        .eq("submission_id", submissionData.submission_id)
        .order("setnum", { ascending: true })

      if (picksError) {
        console.error("Error fetching picks:", picksError)
        return []
      }

      if (picksData) {
        setUserPicks(picksData)
        return picksData
      }

      return []
    } catch (error) {
      console.error("Error in fetch user picks:", error)
      return []
    } finally {
      setLoadingPicks(false)
    }
  }

  const resetPicks = () => setUserPicks([])

  return {
    userPicks,
    loadingPicks,
    fetchUserPicks,
    resetPicks,
    setUserPicks,
  }
}
