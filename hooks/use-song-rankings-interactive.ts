"use client"

import { useCallback, useEffect, useState } from "react"

import { fetchUnrankedCatalogSongs } from "@/lib/ranking-unranked-songs"
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
  const [notStarted, setNotStarted] = useState(false)
  const [restarting, setRestarting] = useState(false)
  const [rankingNew, setRankingNew] = useState(false)
  const [starting, setStarting] = useState(false)
  const [unrankedSongs, setUnrankedSongs] = useState<RankingSongRef[]>([])

  const refreshUnrankedSongs = useCallback(async (ranks: RankingConfirmedRank[]) => {
    if (ranks.length === 0) {
      setUnrankedSongs([])
      return
    }

    try {
      const songs = await fetchUnrankedCatalogSongs(ranks.map((row) => row.song_id))
      setUnrankedSongs(songs)
    } catch {
      setUnrankedSongs([])
    }
  }, [])

  const applyResponse = useCallback(
    async (response: Awaited<ReturnType<typeof invokeRankingEngine>>) => {
      setSessionId(response.session_id || null)
      setSong1(response.song1)
      setSong2(response.song2)
      setConfirmedRanks(response.confirmedRanks ?? [])
      setIsComplete(Boolean(response.isComplete))
      setNotStarted(Boolean(response.notStarted))

      if (response.isComplete && (response.confirmedRanks?.length ?? 0) > 0) {
        await refreshUnrankedSongs(response.confirmedRanks ?? [])
      } else {
        setUnrankedSongs([])
      }
    },
    [refreshUnrankedSongs],
  )

  const loadSession = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    setError(null)
    try {
      const response = await invokeRankingEngine(accessToken, {
        action: "start_session",
        payload: {},
      })
      await applyResponse(response)
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
    void loadSession()
  }, [accessToken, loadSession])

  const beginRanking = useCallback(async () => {
    if (!accessToken) return
    setStarting(true)
    setError(null)
    try {
      const response = await invokeRankingEngine(accessToken, {
        action: "start_session",
        payload: { begin: true },
      })
      await applyResponse(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start ranking session")
    } finally {
      setStarting(false)
    }
  }, [accessToken, applyResponse])

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
        await applyResponse(response)
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
      await applyResponse(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restart ranking")
    } finally {
      setRestarting(false)
    }
  }, [accessToken, applyResponse])

  const rankNewSongs = useCallback(async () => {
    if (!accessToken) return
    setRankingNew(true)
    setError(null)
    try {
      const response = await invokeRankingEngine(accessToken, {
        action: "rank_new_songs",
        payload: {},
      })
      await applyResponse(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start ranking new songs")
    } finally {
      setRankingNew(false)
    }
  }, [accessToken, applyResponse])

  return {
    loading,
    voting,
    restarting,
    rankingNew,
    starting,
    error,
    song1,
    song2,
    confirmedRanks,
    isComplete,
    notStarted,
    unrankedSongs,
    submitVote,
    retry: loadSession,
    restartRanking,
    beginRanking,
    rankNewSongs,
  }
}
