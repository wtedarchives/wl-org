/**
 * Song Rankings — insertion-sort state machine.
 * Auth: Wysteria SSO JWT in `x-wysteria-authorization` (anon JWT in `Authorization`).
 *
 * Song pool: songs.song_rankable = true (maintained by refresh_song_rankable() + daily pg_cron).
 *
 * Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WYSTERIA_JWT_SECRET
 * Optional: WYSTERIA_DEV_MOCK_ALLOWED=true for local dev mock JWTs (wl_dev_mock claim).
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

const SONG_POOL_PAGE_SIZE = 1000

type RankingState = {
  sortedList: string[]
  remaining: string[]
  currentSong: string
  insertionIndex: number
}

type SongRef = {
  song_id: string
  song: string
  categoryArtwork?: string | null
}

type ConfirmedRank = SongRef & { rank: number }

type SupabaseClient = ReturnType<typeof createClient>

function bearerToken(header: string | null): string | null {
  if (!header?.startsWith("Bearer ")) return null
  const token = header.slice(7).trim()
  return token !== "" ? token : null
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const segment = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = segment.padEnd(
      segment.length + ((4 - (segment.length % 4)) % 4),
      "=",
    )
    return JSON.parse(atob(padded)) as Record<string, unknown>
  } catch {
    return null
  }
}

function isDevMockJwtAllowed(): boolean {
  return Deno.env.get("WYSTERIA_DEV_MOCK_ALLOWED") === "true"
}

async function resolveUserIdFromToken(
  token: string,
  jwtSecret: string,
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(jwtSecret),
    )
    const userId = payload.profile_id as string | undefined
    if (userId && UUID_RE.test(userId)) return userId
  } catch {
    // Fall through to dev mock when enabled.
  }

  if (!isDevMockJwtAllowed()) return null

  const decoded = decodeJwtPayload(token)
  if (!decoded || decoded.wl_dev_mock !== true) return null

  const userId = decoded.profile_id as string | undefined
  if (!userId || !UUID_RE.test(userId)) return null

  return userId
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

function normalizeState(raw: unknown): RankingState | null {
  const state = (raw ?? {}) as Partial<RankingState>
  if (
    typeof state.currentSong !== "string" ||
    !UUID_RE.test(state.currentSong) ||
    !Array.isArray(state.sortedList) ||
    !Array.isArray(state.remaining)
  ) {
    return null
  }

  return {
    sortedList: state.sortedList.filter((id): id is string =>
      typeof id === "string" && UUID_RE.test(id)
    ),
    remaining: state.remaining.filter((id): id is string =>
      typeof id === "string" && UUID_RE.test(id)
    ),
    currentSong: state.currentSong,
    insertionIndex: typeof state.insertionIndex === "number" &&
        Number.isInteger(state.insertionIndex) &&
        state.insertionIndex >= 0
      ? state.insertionIndex
      : 0,
  }
}

function buildInitialState(songIds: string[]): RankingState {
  if (songIds.length === 1) {
    return {
      sortedList: [songIds[0]],
      remaining: [],
      currentSong: songIds[0],
      insertionIndex: 0,
    }
  }

  return {
    sortedList: [songIds[0]],
    currentSong: songIds[1],
    remaining: songIds.slice(2),
    insertionIndex: 0,
  }
}

function getMatchup(state: RankingState): { song1Id: string; song2Id: string } | null {
  if (state.remaining.length === 0 && state.sortedList.includes(state.currentSong)) {
    return null
  }
  const challengerId = state.sortedList[state.insertionIndex]
  if (!challengerId || !state.currentSong) return null
  return { song1Id: state.currentSong, song2Id: challengerId }
}

function advanceAfterInsert(state: RankingState): boolean {
  if (state.remaining.length > 0) {
    state.currentSong = state.remaining.shift()!
    state.insertionIndex = 0
    return false
  }
  return true
}

function applyInsertionVote(state: RankingState, currentSongWins: boolean): boolean {
  if (currentSongWins) {
    state.sortedList.splice(state.insertionIndex, 0, state.currentSong)
    return advanceAfterInsert(state)
  }

  state.insertionIndex += 1
  if (state.insertionIndex >= state.sortedList.length) {
    state.sortedList.push(state.currentSong)
    return advanceAfterInsert(state)
  }

  return false
}

function categoryArtworkFromRelation(
  relation: { category_artwork?: string | null } | { category_artwork?: string | null }[] | null,
): string | null {
  const row = Array.isArray(relation) ? relation[0] : relation
  const url = row?.category_artwork
  return typeof url === "string" && url.trim() !== "" ? url.trim() : null
}

async function fetchSongPoolIds(supabase: SupabaseClient): Promise<string[]> {
  const songIds: string[] = []
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from("songs")
      .select("song_id")
      .eq("song_rankable", true)
      .range(from, from + SONG_POOL_PAGE_SIZE - 1)

    if (error) {
      console.error("ranking-engine song pool error:", error)
      throw new Error("Failed to load song pool")
    }

    const rows = data ?? []
    for (const row of rows) {
      if (typeof row.song_id === "string" && UUID_RE.test(row.song_id)) {
        songIds.push(row.song_id)
      }
    }

    if (rows.length < SONG_POOL_PAGE_SIZE) break
    from += SONG_POOL_PAGE_SIZE
  }

  return songIds
}

async function fetchSongRefs(
  supabase: SupabaseClient,
  songIds: string[],
): Promise<Map<string, SongRef>> {
  const uniqueIds = [...new Set(songIds.filter((id) => UUID_RE.test(id)))]
  const map = new Map<string, SongRef>()
  if (uniqueIds.length === 0) return map

  const { data, error } = await supabase
    .from("songs")
    .select("song_id, song, categories:song_category(category_artwork)")
    .in("song_id", uniqueIds)

  if (error) {
    throw new Error("Failed to load songs")
  }

  for (const row of data ?? []) {
    const categoriesRel = row.categories as
      | { category_artwork?: string | null }
      | { category_artwork?: string | null }[]
      | null
    map.set(row.song_id, {
      song_id: row.song_id,
      song: row.song,
      categoryArtwork: categoryArtworkFromRelation(categoriesRel),
    })
  }
  return map
}

async function fetchConfirmedRanks(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<ConfirmedRank[]> {
  const { data, error } = await supabase
    .from("ranking_results")
    .select("song_id, rank, songs(song, categories:song_category(category_artwork))")
    .eq("session_id", sessionId)
    .order("rank", { ascending: true })

  if (error) {
    throw new Error("Failed to load confirmed ranks")
  }

  return (data ?? []).map((row) => {
    const songsRel = row.songs as
      | { song: string; categories?: { category_artwork?: string | null } | { category_artwork?: string | null }[] | null }
      | { song: string; categories?: { category_artwork?: string | null } | { category_artwork?: string | null }[] | null }[]
      | null
    const songRow = Array.isArray(songsRel) ? songsRel[0] : songsRel
    return {
      song_id: row.song_id,
      song: songRow?.song ?? "",
      rank: row.rank,
      categoryArtwork: categoryArtworkFromRelation(songRow?.categories ?? null),
    }
  })
}

async function writeFinalRanks(
  supabase: SupabaseClient,
  sessionId: string,
  sortedList: string[],
) {
  const rows = sortedList.map((songId, index) => ({
    session_id: sessionId,
    song_id: songId,
    rank: index + 1,
  }))

  const { error } = await supabase.from("ranking_results").insert(rows)
  if (error) {
    throw new Error("Failed to save confirmed ranks")
  }
}

function computeRankingProgress(
  state: RankingState | null,
  totalSongs: number,
  isComplete: boolean,
) {
  if (totalSongs <= 0) return null
  if (isComplete) {
    return {
      placedSongs: totalSongs,
      totalSongs,
      percent: 100,
    }
  }
  if (!state) return null

  const placedSongs = Math.min(state.sortedList.length, totalSongs)
  const percent = Math.round((placedSongs / totalSongs) * 1000) / 10

  return {
    placedSongs,
    totalSongs,
    percent,
  }
}

async function fetchSessionPoolSize(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("ranking_sessions")
    .select("song_pool")
    .eq("session_id", sessionId)
    .maybeSingle()

  if (error) {
    throw new Error("Failed to load session pool")
  }

  return Array.isArray(data?.song_pool) ? data.song_pool.length : 0
}

async function buildSessionResponse(
  supabase: SupabaseClient,
  sessionId: string,
  state: RankingState | null,
  confirmedRanks: ConfirmedRank[],
  isComplete: boolean,
) {
  const totalSongs = isComplete && confirmedRanks.length > 0
    ? confirmedRanks.length
    : await fetchSessionPoolSize(supabase, sessionId)

  const matchup = state && !isComplete ? getMatchup(state) : null
  const matchupIds = matchup ? [matchup.song1Id, matchup.song2Id] : []
  const partialList = !isComplete && state ? state.sortedList : []
  const hydrateIds = [...new Set([...matchupIds, ...partialList])]
  const songMap = await fetchSongRefs(supabase, hydrateIds)

  const song1 = matchup
    ? songMap.get(matchup.song1Id) ?? { song_id: matchup.song1Id, song: "" }
    : null
  const song2 = matchup
    ? songMap.get(matchup.song2Id) ?? { song_id: matchup.song2Id, song: "" }
    : null

  const partialRanks = !isComplete && partialList.length > 0
    ? partialList.map((songId, index) => {
      const ref = songMap.get(songId) ?? { song_id: songId, song: "" }
      return {
        rank: index + 1,
        song_id: ref.song_id,
        song: ref.song,
        categoryArtwork: ref.categoryArtwork ?? null,
      }
    })
    : []

  return {
    session_id: sessionId,
    song1,
    song2,
    confirmedRanks: isComplete ? confirmedRanks : [],
    partialRanks,
    progress: computeRankingProgress(state, totalSongs, isComplete),
    isComplete,
  }
}

async function fetchLatestCompleteSession(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("ranking_sessions")
    .select("session_id, state")
    .eq("user_id", userId)
    .eq("status", "complete")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error("Failed to load completed session")
  }
  return data
}

async function sessionHasRankingProgress(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<boolean> {
  const { count, error } = await supabase
    .from("ranking_votes")
    .select("vote_id", { count: "exact", head: true })
    .eq("session_id", sessionId)

  if (error) {
    throw new Error("Failed to load session progress")
  }

  return (count ?? 0) > 0
}

async function deleteOtherUserSessions(
  supabase: SupabaseClient,
  userId: string,
  keepSessionId: string,
) {
  const { data: sessions, error: sessionsError } = await supabase
    .from("ranking_sessions")
    .select("session_id")
    .eq("user_id", userId)

  if (sessionsError) {
    throw new Error("Failed to clean up ranking sessions")
  }

  const otherIds = (sessions ?? [])
    .map((row) => row.session_id)
    .filter((id): id is string =>
      typeof id === "string" && UUID_RE.test(id) && id !== keepSessionId
    )

  if (otherIds.length === 0) return

  const { error: votesError } = await supabase
    .from("ranking_votes")
    .delete()
    .in("session_id", otherIds)

  if (votesError) {
    throw new Error("Failed to clean up ranking votes")
  }

  const { error: resultsError } = await supabase
    .from("ranking_results")
    .delete()
    .in("session_id", otherIds)

  if (resultsError) {
    throw new Error("Failed to clean up ranking results")
  }

  const { error: deleteError } = await supabase
    .from("ranking_sessions")
    .delete()
    .in("session_id", otherIds)

  if (deleteError) {
    throw new Error("Failed to clean up ranking sessions")
  }
}

async function abandonEmptyInProgressSession(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ session_id: string; state: RankingState } | null> {
  const { data: inProgress, error: inProgressError } = await supabase
    .from("ranking_sessions")
    .select("session_id, state")
    .eq("user_id", userId)
    .eq("status", "in_progress")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (inProgressError) {
    throw new Error("Failed to load session")
  }

  if (!inProgress) return null

  const hasProgress = await sessionHasRankingProgress(supabase, inProgress.session_id)
  const state = normalizeState(inProgress.state)

  if (hasProgress && state) {
    return { session_id: inProgress.session_id, state }
  }

  const { error: deleteError } = await supabase
    .from("ranking_sessions")
    .delete()
    .eq("session_id", inProgress.session_id)

  if (deleteError) {
    throw new Error("Failed to load session")
  }

  return null
}

function isStateComplete(state: RankingState): boolean {
  return state.remaining.length === 0 && state.sortedList.includes(state.currentSong)
}

async function createRankingSessionWithState(
  supabase: SupabaseClient,
  userId: string,
  songPool: string[],
  initialState: RankingState,
) {
  const isComplete = songPool.length === 1 || isStateComplete(initialState)

  const { data: inserted, error: insertError } = await supabase
    .from("ranking_sessions")
    .insert({
      user_id: userId,
      status: isComplete ? "complete" : "in_progress",
      song_pool: songPool,
      state: initialState,
    })
    .select("session_id")
    .single()

  if (insertError || !inserted) {
    console.error("ranking-engine insert session error:", insertError)
    return jsonResponse({ error: "Failed to create session" }, 500)
  }

  if (isComplete) {
    await writeFinalRanks(supabase, inserted.session_id, initialState.sortedList)
    await deleteOtherUserSessions(supabase, userId, inserted.session_id)
  }

  const confirmedRanks = isComplete
    ? await fetchConfirmedRanks(supabase, inserted.session_id)
    : []

  const body = await buildSessionResponse(
    supabase,
    inserted.session_id,
    initialState,
    confirmedRanks,
    isComplete,
  )
  return jsonResponse(body, 200)
}

async function createNewRankingSession(supabase: SupabaseClient, userId: string) {
  const songIds = shuffle(await fetchSongPoolIds(supabase))
  if (songIds.length === 0) {
    return jsonResponse({ error: "No songs available for ranking" }, 400)
  }

  const initialState = buildInitialState(songIds)
  return createRankingSessionWithState(supabase, userId, songIds, initialState)
}

async function handleStartSession(
  supabase: SupabaseClient,
  userId: string,
  payload: Record<string, unknown>,
) {
  const begin = payload.begin === true

  try {
    const resumed = await abandonEmptyInProgressSession(supabase, userId)
    if (resumed) {
      const body = await buildSessionResponse(
        supabase,
        resumed.session_id,
        resumed.state,
        [],
        false,
      )
      return jsonResponse(body, 200)
    }
  } catch (error) {
    console.error("ranking-engine start_session in-progress error:", error)
    return jsonResponse({ error: "Failed to load session" }, 500)
  }

  try {
    const completed = await fetchLatestCompleteSession(supabase, userId)
    if (completed) {
      const state = normalizeState(completed.state)
      const confirmedRanks = await fetchConfirmedRanks(supabase, completed.session_id)
      const body = await buildSessionResponse(
        supabase,
        completed.session_id,
        state,
        confirmedRanks,
        true,
      )
      return jsonResponse(body, 200)
    }
  } catch (error) {
    console.error("ranking-engine completed session lookup error:", error)
    return jsonResponse({ error: "Failed to load session" }, 500)
  }

  if (begin) {
    return createNewRankingSession(supabase, userId)
  }

  return jsonResponse({
    session_id: "",
    song1: null,
    song2: null,
    confirmedRanks: [],
    isComplete: false,
    notStarted: true,
  })
}

function buildRankNewSongsState(
  rankedIds: string[],
  unrankedIds: string[],
): RankingState {
  const shuffledNew = shuffle(unrankedIds)
  if (shuffledNew.length === 1) {
    return {
      sortedList: [...rankedIds, shuffledNew[0]],
      remaining: [],
      currentSong: shuffledNew[0],
      insertionIndex: 0,
    }
  }

  return {
    sortedList: [...rankedIds],
    remaining: shuffledNew.slice(1),
    currentSong: shuffledNew[0],
    insertionIndex: 0,
  }
}

async function handleRankNewSongsSession(supabase: SupabaseClient, userId: string) {
  try {
    const completed = await fetchLatestCompleteSession(supabase, userId)
    if (!completed) {
      return jsonResponse({ error: "Complete your rankings before ranking new songs" }, 400)
    }

    const confirmedRanks = await fetchConfirmedRanks(supabase, completed.session_id)
    const rankedIds = [...confirmedRanks]
      .sort((a, b) => a.rank - b.rank)
      .map((row) => row.song_id)

    const catalogIds = await fetchSongPoolIds(supabase)
    const rankedSet = new Set(rankedIds)
    const unrankedIds = catalogIds.filter((id) => !rankedSet.has(id))

    if (unrankedIds.length === 0) {
      return jsonResponse({ error: "No new songs to rank" }, 400)
    }

    const resumed = await abandonEmptyInProgressSession(supabase, userId)
    if (resumed) {
      const body = await buildSessionResponse(
        supabase,
        resumed.session_id,
        resumed.state,
        [],
        false,
      )
      return jsonResponse(body, 200)
    }

    const initialState = buildRankNewSongsState(rankedIds, unrankedIds)
    const songPool = [...rankedIds, ...unrankedIds]
    return createRankingSessionWithState(supabase, userId, songPool, initialState)
  } catch (error) {
    console.error("ranking-engine rank_new_songs error:", error)
    return jsonResponse({ error: "Failed to start ranking new songs" }, 500)
  }
}

async function handleRestartSession(supabase: SupabaseClient, userId: string) {
  const { data: sessions, error: sessionsError } = await supabase
    .from("ranking_sessions")
    .select("session_id")
    .eq("user_id", userId)

  if (sessionsError) {
    console.error("ranking-engine restart session lookup error:", sessionsError)
    return jsonResponse({ error: "Failed to load ranking sessions for restart" }, 500)
  }

  const sessionIds = (sessions ?? [])
    .map((row) => row.session_id)
    .filter((id): id is string => typeof id === "string" && UUID_RE.test(id))

  if (sessionIds.length > 0) {
    const { error: votesError } = await supabase
      .from("ranking_votes")
      .delete()
      .in("session_id", sessionIds)

    if (votesError) {
      console.error("ranking-engine restart votes delete error:", votesError)
      return jsonResponse({ error: "Failed to delete ranking votes" }, 500)
    }

    const { error: resultsError } = await supabase
      .from("ranking_results")
      .delete()
      .in("session_id", sessionIds)

    if (resultsError) {
      console.error("ranking-engine restart results delete error:", resultsError)
      return jsonResponse({ error: "Failed to delete ranking results" }, 500)
    }
  }

  const { error: sessionsDeleteError } = await supabase
    .from("ranking_sessions")
    .delete()
    .eq("user_id", userId)

  if (sessionsDeleteError) {
    console.error("ranking-engine restart sessions delete error:", sessionsDeleteError)
    return jsonResponse({ error: "Failed to delete ranking sessions" }, 500)
  }

  return createNewRankingSession(supabase, userId)
}

async function handleSubmitVote(
  supabase: SupabaseClient,
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
  if (!state) {
    return jsonResponse({ error: "Invalid session state" }, 400)
  }

  const matchup = getMatchup(state)
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

  const currentSongWins = winnerId === state.currentSong
  const isComplete = applyInsertionVote(state, currentSongWins)

  if (isComplete) {
    await writeFinalRanks(supabase, sessionId, state.sortedList)
    await deleteOtherUserSessions(supabase, userId, sessionId)
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

  const confirmedRanks = isComplete
    ? await fetchConfirmedRanks(supabase, sessionId)
    : []

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

  const userId = await resolveUserIdFromToken(token, jwtSecret)
  if (!userId) {
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
      return await handleStartSession(supabase, userId, payload)
    }
    if (action === "rank_new_songs") {
      return await handleRankNewSongsSession(supabase, userId)
    }
    if (action === "restart_session") {
      return await handleRestartSession(supabase, userId)
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
