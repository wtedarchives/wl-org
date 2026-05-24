import { WYSTERIA_AUTH_HEADER } from "@/lib/dpro-admin-edge"
import { getSupabaseFunctionsUrl } from "@/lib/supabase-functions"

export type RankingSongRef = {
  song_id: string
  song: string
  categoryArtwork?: string | null
}

export type RankingConfirmedRank = RankingSongRef & {
  rank: number
}

export type RankingProgress = {
  placedSongs: number
  totalSongs: number
  percent: number
}

export type RankingEngineResponse = {
  session_id: string
  song1: RankingSongRef | null
  song2: RankingSongRef | null
  confirmedRanks: RankingConfirmedRank[]
  partialRanks?: RankingConfirmedRank[]
  progress?: RankingProgress | null
  isComplete?: boolean
  notStarted?: boolean
  error?: string
}

export type RankingEngineBody =
  | { action: "start_session"; payload?: { begin?: boolean } }
  | { action: "restart_session"; payload?: Record<string, never> }
  | { action: "rank_new_songs"; payload?: Record<string, never> }
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
  if (!payload.notStarted && !payload.session_id) {
    throw new Error("Invalid ranking response")
  }

  return payload
}
