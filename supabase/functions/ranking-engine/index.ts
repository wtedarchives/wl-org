/**
 * Song Rankings state machine — winner-stays chain + tier resolution.
 * Auth: Wysteria SSO JWT in `x-wysteria-authorization` (anon JWT in `Authorization`).
 *
 * Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WYSTERIA_JWT_SECRET
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { jwtVerify } from "https://deno.land/x/jose@v4.15.5/index.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-wysteria-authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const SONG_POOL_CATEGORY = "Everything Must Go"

type ActiveChain = {
  champion: string
  remaining: string[]
  rankRange: [number, number]
  defeated: string[]
  defeatedBy?: Record<string, string>
}

type Tier = {
  songs: string[]
  rankRange: [number, number]
}

type RankingState = {
  prefGraph: Record<string, string[]>
  tierQueue: Tier[]
  activeChain: ActiveChain | null
}

type SongRef = {
  song_id: string
  song: string
}

type ConfirmedRank = SongRef & { rank: number }

function bearerToken(header: string | null): string | null {
  if (!header?.startsWith("Bearer ")) return null
  const token = header.slice(7).trim()
  return token !== "" ? token : null
}

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function normalizeActiveChain(chain: ActiveChain | null | undefined): ActiveChain | null {
  if (!chain?.champion) return null
  return {
    champion: chain.champion,
    remaining: Array.isArray(chain.remaining) ? chain.remaining : [],
    rankRange: chain.rankRange,
    defeated: Array.isArray(chain.defeated) ? chain.defeated : [],
    defeatedBy: chain.defeatedBy ?? {},
  }
}

function normalizeState(raw: unknown): RankingState {
  const state = (raw ?? {}) as Partial<RankingState>
  return {
    prefGraph: state.prefGraph && typeof state.prefGraph === "object" ? state.prefGraph : {},
    tierQueue: Array.isArray(state.tierQueue) ? state.tierQueue : [],
    activeChain: normalizeActiveChain(state.activeChain as ActiveChain | null),
  }
}

function getMatchup(chain: ActiveChain | null): { song1Id: string; song2Id: string } | null {
  if (!chain || chain.remaining.length === 0) return null
  return { song1Id: chain.champion, song2Id: chain.remaining[0] }
}

function addPrefEdge(prefGraph: Record<string, string[]>, winnerId: string, loserId: string) {
  if (!prefGraph[winnerId]) prefGraph[winnerId] = []
  if (!prefGraph[winnerId].includes(loserId)) {
    prefGraph[winnerId].push(loserId)
  }
}

function buildSubTiers(
  defeated: string[],
  defeatedBy: Record<string, string>,
  confirmedRank: number,
): Tier[] {
  const beaterOrder: string[] = []
  const groups = new Map<string, string[]>()

  for (const songId of defeated) {
    const beater = defeatedBy[songId]
    if (!beater) continue
    if (!groups.has(beater)) {
      groups.set(beater, [])
      beaterOrder.push(beater)
    }
    groups.get(beater)!.push(songId)
  }

  let nextRank = confirmedRank + 1
  const tiers: Tier[] = []

  for (const beater of beaterOrder) {
    const songs = groups.get(beater)!
    const tierEnd = nextRank + songs.length - 1
    tiers.push({ songs, rankRange: [nextRank, tierEnd] })
    nextRank = tierEnd + 1
  }

  tiers.sort((a, b) => a.rankRange[0] - b.rankRange[0])
  return tiers
}

function activateTier(tier: Tier): ActiveChain {
  const shuffled = shuffle(tier.songs)
  const [champion, ...remaining] = shuffled
  return {
    champion,
    remaining,
    rankRange: tier.rankRange,
    defeated: [],
    defeatedBy: {},
  }
}

function mergeTierQueue(queue: Tier[], newTiers: Tier[]): Tier[] {
  return [...queue, ...newTiers].sort((a, b) => a.rankRange[0] - b.rankRange[0])
}

async function fetchSongRefs(
  supabase: ReturnType<typeof createClient>,
  songIds: string[],
): Promise<Map<string, SongRef>> {
  const uniqueIds = [...new Set(songIds.filter((id) => UUID_RE.test(id)))]
  const map = new Map<string, SongRef>()
  if (uniqueIds.length === 0) return map

  const { data, error } = await supabase
    .from("songs")
    .select("song_id, song")
    .in("song_id", uniqueIds)

  if (error) {
    throw new Error("Failed to load songs")
  }

  for (const row of data ?? []) {
    map.set(row.song_id, { song_id: row.song_id, song: row.song })
  }
  return map
}

async function fetchConfirmedRanks(
  supabase: ReturnType<typeof createClient>,
  sessionId: string,
): Promise<ConfirmedRank[]> {
  const { data, error } = await supabase
    .from("ranking_results")
    .select("song_id, rank, songs(song)")
    .eq("session_id", sessionId)
    .order("rank", { ascending: true })

  if (error) {
    throw new Error("Failed to load confirmed ranks")
  }

  return (data ?? []).map((row) => {
    const songsRel = row.songs as { song: string } | { song: string }[] | null
    const songRow = Array.isArray(songsRel) ? songsRel[0] : songsRel
    return {
      song_id: row.song_id,
      song: songRow?.song ?? "",
      rank: row.rank,
    }
  })
}

async function buildSessionResponse(
  supabase: ReturnType<typeof createClient>,
  sessionId: string,
  state: RankingState,
  confirmedRanks: ConfirmedRank[],
  isComplete: boolean,
) {
  const matchup = getMatchup(state.activeChain)
  const songIds = matchup ? [matchup.song1Id, matchup.song2Id] : []
  const songMap = await fetchSongRefs(supabase, songIds)

  const song1 = matchup
    ? songMap.get(matchup.song1Id) ?? { song_id: matchup.song1Id, song: "" }
    : null
  const song2 = matchup
    ? songMap.get(matchup.song2Id) ?? { song_id: matchup.song2Id, song: "" }
    : null

  return {
    session_id: sessionId,
    song1,
    song2,
    confirmedRanks,
    isComplete,
  }
}

async function confirmRank(
  supabase: ReturnType<typeof createClient>,
  sessionId: string,
  songId: string,
  rank: number,
) {
  const { error } = await supabase.from("ranking_results").insert({
    session_id: sessionId,
    song_id: songId,
    rank,
  })
  if (error) {
    throw new Error("Failed to save confirmed rank")
  }
}

async function resolveAutomaticChains(
  supabase: ReturnType<typeof createClient>,
  sessionId: string,
  state: RankingState,
): Promise<{ state: RankingState; isComplete: boolean }> {
  while (state.activeChain && state.activeChain.remaining.length === 0) {
    const chain = state.activeChain
    const confirmedRank = chain.rankRange[0]

    await confirmRank(supabase, sessionId, chain.champion, confirmedRank)

    const subTiers = buildSubTiers(
      chain.defeated,
      chain.defeatedBy ?? {},
      confirmedRank,
    )
    state.tierQueue = mergeTierQueue(state.tierQueue, subTiers)
    state.activeChain = null

    if (state.tierQueue.length === 0) {
      return { state, isComplete: true }
    }

    const nextTier = state.tierQueue.shift()!
    state.activeChain = activateTier(nextTier)
  }

  return { state, isComplete: false }
}

async function handleStartSession(
  supabase: ReturnType<typeof createClient>,
  userId: string,
) {
  const { data: existing, error: existingError } = await supabase
    .from("ranking_sessions")
    .select("session_id, user_id, status, song_pool, state")
    .eq("user_id", userId)
    .eq("status", "in_progress")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingError) {
    console.error("ranking-engine start_session lookup error:", existingError)
    return jsonResponse({ error: "Failed to load session" }, 500)
  }

  if (existing) {
    const state = normalizeState(existing.state)
    const confirmedRanks = await fetchConfirmedRanks(supabase, existing.session_id)
    const body = await buildSessionResponse(
      supabase,
      existing.session_id,
      state,
      confirmedRanks,
      false,
    )
    return jsonResponse(body, 200)
  }

  const { data: songs, error: songsError } = await supabase
    .from("songs")
    .select("song_id")
    .eq("song_category", SONG_POOL_CATEGORY)
    .eq("song_placeholder", false)

  if (songsError) {
    console.error("ranking-engine song pool error:", songsError)
    return jsonResponse({ error: "Failed to load song pool" }, 500)
  }

  const songIds = shuffle((songs ?? []).map((row) => row.song_id))
  if (songIds.length === 0) {
    return jsonResponse({ error: "No songs available for ranking" }, 400)
  }

  const initialState: RankingState = {
    prefGraph: {},
    tierQueue: [],
    activeChain: {
      champion: songIds[0],
      remaining: songIds.slice(1),
      rankRange: [1, songIds.length],
      defeated: [],
      defeatedBy: {},
    },
  }

  const { data: inserted, error: insertError } = await supabase
    .from("ranking_sessions")
    .insert({
      user_id: userId,
      status: "in_progress",
      song_pool: songIds,
      state: initialState,
    })
    .select("session_id")
    .single()

  if (insertError || !inserted) {
    console.error("ranking-engine insert session error:", insertError)
    return jsonResponse({ error: "Failed to create session" }, 500)
  }

  let finalState = initialState
  let isComplete = false

  if (songIds.length === 1) {
    await confirmRank(supabase, inserted.session_id, songIds[0], 1)
    finalState = { prefGraph: {}, tierQueue: [], activeChain: null }
    isComplete = true

    const { error: updateError } = await supabase
      .from("ranking_sessions")
      .update({
        state: finalState,
        status: "complete",
        updated_at: new Date().toISOString(),
      })
      .eq("session_id", inserted.session_id)

    if (updateError) {
      console.error("ranking-engine single-song finalize error:", updateError)
      return jsonResponse({ error: "Failed to finalize session" }, 500)
    }
  }

  const confirmedRanks = await fetchConfirmedRanks(supabase, inserted.session_id)
  const body = await buildSessionResponse(
    supabase,
    inserted.session_id,
    finalState,
    confirmedRanks,
    isComplete,
  )
  return jsonResponse(body, 200)
}

async function handleSubmitVote(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  payload: Record<string, unknown>,
) {
  const sessionId = typeof payload.session_id === "string" ? payload.session_id.trim() : ""
  const winnerId = typeof payload.winner_id === "string" ? payload.winner_id.trim() : ""
  const loserId = typeof payload.loser_id === "string" ? payload.loser_id.trim() : ""

  if (!sessionId || !UUID_RE.test(sessionId)) {
    return jsonResponse({ error: "Missing or invalid session_id" }, 400)
  }
  if (!winnerId || !UUID_RE.test(winnerId)) {
    return jsonResponse({ error: "Missing or invalid winner_id" }, 400)
  }
  if (!loserId || !UUID_RE.test(loserId)) {
    return jsonResponse({ error: "Missing or invalid loser_id" }, 400)
  }
  if (winnerId === loserId) {
    return jsonResponse({ error: "winner_id and loser_id must differ" }, 400)
  }

  const { data: session, error: sessionError } = await supabase
    .from("ranking_sessions")
    .select("session_id, user_id, status, state")
    .eq("session_id", sessionId)
    .maybeSingle()

  if (sessionError) {
    console.error("ranking-engine submit_vote lookup error:", sessionError)
    return jsonResponse({ error: "Failed to load session" }, 500)
  }
  if (!session) {
    return jsonResponse({ error: "Session not found" }, 404)
  }
  if (session.user_id !== userId) {
    return jsonResponse({ error: "Forbidden" }, 403)
  }
  if (session.status !== "in_progress") {
    return jsonResponse({ error: "Session is not in progress" }, 400)
  }

  const state = normalizeState(session.state)
  const matchup = getMatchup(state.activeChain)
  if (!matchup) {
    return jsonResponse({ error: "No active matchup" }, 400)
  }

  const validPair =
    (winnerId === matchup.song1Id && loserId === matchup.song2Id) ||
    (winnerId === matchup.song2Id && loserId === matchup.song1Id)

  if (!validPair) {
    return jsonResponse({ error: "Vote does not match the current matchup" }, 400)
  }

  const { error: voteError } = await supabase.from("ranking_votes").insert({
    session_id: sessionId,
    song_1_id: matchup.song1Id,
    song_2_id: matchup.song2Id,
    winner_id: winnerId,
  })

  if (voteError) {
    console.error("ranking-engine vote insert error:", voteError)
    return jsonResponse({ error: "Failed to record vote" }, 500)
  }

  addPrefEdge(state.prefGraph, winnerId, loserId)

  const chain = state.activeChain!
  chain.champion = winnerId
  chain.defeated.push(loserId)
  chain.defeatedBy = chain.defeatedBy ?? {}
  chain.defeatedBy[loserId] = winnerId
  chain.remaining.shift()

  let isComplete = false

  if (chain.remaining.length > 0) {
    state.activeChain = chain
  } else {
    const resolved = await resolveAutomaticChains(supabase, sessionId, state)
    isComplete = resolved.isComplete
  }

  const { error: updateError } = await supabase
    .from("ranking_sessions")
    .update({
      state,
      status: isComplete ? "complete" : "in_progress",
      updated_at: new Date().toISOString(),
    })
    .eq("session_id", sessionId)

  if (updateError) {
    console.error("ranking-engine session update error:", updateError)
    return jsonResponse({ error: "Failed to update session" }, 500)
  }

  const confirmedRanks = await fetchConfirmedRanks(supabase, sessionId)
  const body = await buildSessionResponse(
    supabase,
    sessionId,
    state,
    confirmedRanks,
    isComplete,
  )
  return jsonResponse(body, 200)
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405)
  }

  const token =
    bearerToken(req.headers.get("x-wysteria-authorization")) ??
    bearerToken(req.headers.get("authorization"))
  if (!token) {
    return jsonResponse({ error: "Unauthorized" }, 401)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const jwtSecret = Deno.env.get("WYSTERIA_JWT_SECRET")
  if (!supabaseUrl || !supabaseServiceKey || !jwtSecret) {
    return jsonResponse({ error: "Server configuration error" }, 500)
  }

  let jwtPayload: Record<string, unknown>
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret))
    jwtPayload = payload as Record<string, unknown>
  } catch {
    return jsonResponse({ error: "Unauthorized" }, 401)
  }

  const userId = jwtPayload.profile_id as string | undefined
  if (!userId || !UUID_RE.test(userId)) {
    return jsonResponse({ error: "Unauthorized" }, 401)
  }

  let body: { action?: string; payload?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400)
  }

  const action = typeof body.action === "string" ? body.action.trim() : ""
  const payload = body.payload && typeof body.payload === "object" ? body.payload : {}

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    if (action === "start_session") {
      return await handleStartSession(supabase, userId)
    }
    if (action === "submit_vote") {
      return await handleSubmitVote(supabase, userId, payload)
    }
    return jsonResponse({ error: "Invalid action" }, 400)
  } catch (error) {
    console.error("ranking-engine error:", error)
    const message = error instanceof Error ? error.message : "Internal server error"
    return jsonResponse({ error: message }, 500)
  }
})
