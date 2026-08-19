"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-context"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"

export interface ScoringState {
  isScoring: boolean
  scoringComplete: boolean
  scoringError: string | null
}

export function useSetlistScoring() {
  const { session } = useAuth()
  const [isScoring, setIsScoring] = useState(false)
  const [scoringComplete, setScoringComplete] = useState(false)
  const [scoringError, setScoringError] = useState<string | null>(null)

  const scoreSubmissions = async (
    selectedShowToScore: string,
    onComplete?: () => void,
  ) => {
    if (!selectedShowToScore) return

    const token = session?.token
    if (!token) {
      setScoringError("You must be signed in.")
      return
    }

    try {
      setIsScoring(true)
      setScoringError(null)

      const { error } = await invokeDproAdmin(token, {
        action: "setlist_game_score_show",
        show_id: selectedShowToScore,
      })

      if (error) {
        throw new Error(error)
      }

      setScoringComplete(true)

      if (onComplete) {
        setTimeout(() => {
          onComplete()
          setScoringComplete(false)
        }, 2000)
      }
    } catch (error) {
      console.error("Error scoring submissions:", error)
      setScoringError(
        error instanceof Error
          ? error.message
          : "Failed to score submissions. Please try again.",
      )
    } finally {
      setIsScoring(false)
    }
  }

  const recalcShow = async (showId: string) => {
    if (!showId) return
    const token = session?.token
    if (!token) {
      setScoringError("You must be signed in.")
      return
    }
    try {
      setIsScoring(true)
      setScoringError(null)
      const { error } = await invokeDproAdmin(token, {
        action: "setlist_game_recalc_show",
        show_id: showId,
      })
      if (error) throw new Error(error)
    } catch (error) {
      console.error("Error recalculating submissions:", error)
      setScoringError(
        error instanceof Error
          ? error.message
          : "Failed to recalc. Please try again.",
      )
    } finally {
      setIsScoring(false)
    }
  }

  return {
    isScoring,
    scoringComplete,
    scoringError,
    scoreSubmissions,
    recalcShow,
  }
}
