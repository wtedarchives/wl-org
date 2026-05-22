"use client"

import { useCallback, useEffect, useState } from "react"

import {
  invokeRankingEngine,
  type RankingConfirmedRank,
  type RankingSongRef,
} from "@/lib/ranking-engine-edge"

export function useSongRankingsInteractive(accessToken: string | null | undefined) {
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [song1, setSong1] = useState<RankingSongRef | null>(null)
  const [song2, setSong2] = useState<RankingSongRef | null>(null)
  const [confirmedRanks, setConfirmedRanks] = useState<RankingConfirmedRank[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [restarting, setRestarting] = useState(false)

  const applyResponse = useCallback(
    (response: Awaited<ReturnType<typeof invokeRankingEngine>>) => {
      setSessionId(response.session_id)
      setSong1(response.song1)
      setSong2(response.song2)
      setConfirmedRanks(response.confirmedRanks ?? [])
      setIsComplete(Boolean(response.isComplete))
    },
    [],
  )

  const startSession = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    setError(null)
    try {
      const response = await invokeRankingEngine(accessToken, {
        action: "start_session",
        payload: {},
      })
      applyResponse(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start ranking session")
    } finally {
      setLoading(false)
    }
  }, [accessToken, applyResponse])

  useEffect(() => {
    if (!accessToken) {
      setLoading(false)
      return
    }
    void startSession()
  }, [accessToken, startSession])

  const submitVote = useCallback(
    async (winnerId: string, loserId: string) => {
      if (!accessToken || !sessionId || voting || isComplete) return
      setVoting(true)
      setError(null)
      try {
        const response = await invokeRankingEngine(accessToken, {
          action: "submit_vote",
          payload: { session_id: sessionId, winner_id: winnerId, loser_id: loserId },
        })
        applyResponse(response)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit vote")
      } finally {
        setVoting(false)
      }
    },
    [accessToken, applyResponse, isComplete, sessionId, voting],
  )

  const restartRanking = useCallback(async () => {
    if (!accessToken) return
    setRestarting(true)
    setError(null)
    try {
      const response = await invokeRankingEngine(accessToken, {
        action: "restart_session",
        payload: {},
      })
      applyResponse(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restart ranking")
    } finally {
      setRestarting(false)
    }
  }, [accessToken, applyResponse])

  return {
    loading,
    voting,
    restarting,
    error,
    song1,
    song2,
    confirmedRanks,
    isComplete,
    submitVote,
    retry: startSession,
    restartRanking,
  }
}
