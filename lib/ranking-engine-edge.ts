import { WYSTERIA_AUTH_HEADER } from "@/lib/dpro-admin-edge"
import { getSupabaseFunctionsUrl } from "@/lib/supabase-functions"
import { supabase } from "@/lib/supabase"

export type RankingSongRef = {
  song_id: string
  song: string
}

export type RankingConfirmedRank = RankingSongRef & {
  rank: number
}

export type RankingEngineResponse = {
  session_id: string
  song1: RankingSongRef | null
  song2: RankingSongRef | null
  confirmedRanks: RankingConfirmedRank[]
  isComplete?: boolean
  error?: string
}

export type RankingEngineBody =
  | { action: "start_session"; payload?: Record<string, never> }
  | {
      action: "submit_vote"
      payload: { session_id: string; winner_id: string; loser_id: string }
    }

export async function invokeRankingEngine(
  accessToken: string,
  body: RankingEngineBody,
): Promise<RankingEngineResponse> {
  const base = getSupabaseFunctionsUrl()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  if (!base || !anonKey) {
    throw new Error("Unable to connect. Please try again.")
  }

  const res = await fetch(`${base}/ranking-engine`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anonKey}`,
      [WYSTERIA_AUTH_HEADER]: `Bearer ${accessToken}`,
      apikey: anonKey,
    },
    body: JSON.stringify(body),
  })

  const payload = (await res.json().catch(() => ({}))) as RankingEngineResponse

  if (!res.ok) {
    throw new Error(payload.error ?? `Ranking request failed (${res.status})`)
  }
  if (payload.error) {
    throw new Error(payload.error)
  }
  if (!payload.session_id) {
    throw new Error("Invalid ranking response")
  }

  return payload
}

export async function fetchRankingSessionPoolSize(
  sessionId: string,
): Promise<number> {
  if (!supabase) return 0

  const { data, error } = await supabase
    .from("ranking_sessions")
    .select("song_pool")
    .eq("session_id", sessionId)
    .maybeSingle()

  if (error || !data?.song_pool) return 0
  return Array.isArray(data.song_pool) ? data.song_pool.length : 0
}
