import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

export const BOT_READ_API_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
}

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const SETLIST_GAME_CATEGORY_TYPES = [
  "Goose",
  "Goose Misc",
  "Ted Tapes",
  "Cover Songs",
] as const

const RECORDING_SESSION_DETAIL_PHRASE = "Recording Session"

export type BotApiKeyRow = {
  id: string
  label: string
  revoked_at: string | null
}

export type ApiEnvelope<T> = {
  data: T
  meta: { count: number }
}

export function jsonResponse(
  body: Record<string, unknown>,
  status: number,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...BOT_READ_API_CORS, "Content-Type": "application/json" },
  })
}

export function successResponse<T>(data: T): Response {
  const payload: ApiEnvelope<T> = {
    data,
    meta: { count: Array.isArray(data) ? data.length : 0 },
  }
  return jsonResponse(payload as unknown as Record<string, unknown>, 200)
}

export function createServiceClient(): SupabaseClient | null {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !supabaseServiceKey) return null
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  )
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

export function extractApiKey(req: Request): string | null {
  const headerKey = req.headers.get("x-api-key")?.trim()
  if (headerKey) return headerKey

  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  const token = auth.slice(7).trim()
  return token !== "" ? token : null
}

export function isRecordingSessionShow(
  show: { show_detail?: string | null } | null | undefined,
): boolean {
  const detail = show?.show_detail
  if (!detail) return false
  return detail.includes(RECORDING_SESSION_DETAIL_PHRASE)
}

export function excludeRecordingSessionShows<
  T extends { show_detail?: string | null },
>(shows: T[]): T[] {
  return shows.filter((show) => !isRecordingSessionShow(show))
}

export function normalizeLastCount(
  raw: string | null | undefined,
): number | null {
  if (raw == null || raw.trim() === "") return null
  const trimmed = raw.trim()
  if (trimmed.toLowerCase() === "debut") return 0
  const match = trimmed.match(/^(\d+)/)
  return match ? parseInt(match[1], 10) : null
}

function entrySetSortKey(set: string): { group: number; num: number } {
  const value = String(set ?? "").trim()
  if (value.startsWith("E")) {
    const encoreNum = parseInt(value.substring(1), 10)
    return { group: 1, num: Number.isFinite(encoreNum) ? encoreNum : 0 }
  }
  const setNum = parseInt(value, 10)
  return { group: 0, num: Number.isFinite(setNum) ? setNum : 0 }
}

export function compareSetlistEntries(
  a: { entry_set: string; entry_setnum: number },
  b: { entry_set: string; entry_setnum: number },
): number {
  const keyA = entrySetSortKey(a.entry_set)
  const keyB = entrySetSortKey(b.entry_set)
  if (keyA.group !== keyB.group) return keyA.group - keyB.group
  if (keyA.num !== keyB.num) return keyA.num - keyB.num
  return a.entry_setnum - b.entry_setnum
}

export function compareShowsForBotApi(
  a: {
    show_canonid: number | null
    show_date: string
    show_group: string
  },
  b: {
    show_canonid: number | null
    show_date: string
    show_group: string
  },
): number {
  const aHasCanon = a.show_canonid != null
  const bHasCanon = b.show_canonid != null
  if (aHasCanon !== bHasCanon) return aHasCanon ? -1 : 1

  const canonA = a.show_canonid ?? Number.MAX_SAFE_INTEGER
  const canonB = b.show_canonid ?? Number.MAX_SAFE_INTEGER
  if (canonA !== canonB) return canonA - canonB

  if (a.show_date !== b.show_date) {
    return a.show_date.localeCompare(b.show_date)
  }

  return a.show_group.localeCompare(b.show_group)
}

async function fetchAllRows<T>(
  fetchPage: (
    from: number,
    to: number,
  ) => Promise<{ data: T[] | null; error: { message: string } | null }>,
): Promise<{ rows: T[]; error: string | null }> {
  const pageSize = 1000
  let page = 0
  const rows: T[] = []

  while (true) {
    const from = page * pageSize
    const to = from + pageSize - 1
    const { data, error } = await fetchPage(from, to)
    if (error) return { rows: [], error: error.message }
    const batch = data ?? []
    rows.push(...batch)
    if (batch.length < pageSize) break
    page += 1
  }

  return { rows, error: null }
}

export async function validateApiKey(
  client: SupabaseClient,
  rawKey: string,
): Promise<{ key: BotApiKeyRow | null; error: string | null }> {
  const keyHash = await sha256Hex(rawKey)
  const { data, error } = await client
    .from("bot_api_keys")
    .select("id, label, revoked_at")
    .eq("key_hash", keyHash)
    .maybeSingle()

  if (error) return { key: null, error: error.message }
  if (!data || data.revoked_at) return { key: null, error: null }

  return { key: data as BotApiKeyRow, error: null }
}

export async function logBotApiRequest(
  client: SupabaseClient,
  input: {
    apiKeyId: string | null
    endpoint: string
    queryParams: Record<string, string>
    statusCode: number
    errorMessage?: string | null
    durationMs: number
  },
): Promise<void> {
  const { error } = await client.from("bot_api_request_logs").insert({
    api_key_id: input.apiKeyId,
    endpoint: input.endpoint,
    query_params: input.queryParams,
    status_code: input.statusCode,
    error_message: input.errorMessage ?? null,
    duration_ms: input.durationMs,
  })

  if (error) {
    console.error("bot-read-api log insert failed:", error.message)
  }
}

export async function touchApiKeyLastUsed(
  client: SupabaseClient,
  apiKeyId: string,
): Promise<void> {
  const { error } = await client
    .from("bot_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", apiKeyId)

  if (error) {
    console.error("bot-read-api last_used update failed:", error.message)
  }
}

export async function handleToursEndpoint(
  client: SupabaseClient,
): Promise<{ response: Response; errorMessage: string | null }> {
  const { data, error } = await client
    .from("tours")
    .select("tour, tour_canonid, tour_id")
    .order("tour_canonid", { ascending: true })

  if (error) {
    return {
      response: jsonResponse({ error: "Failed to load tours" }, 500),
      errorMessage: error.message,
    }
  }

  return {
    response: successResponse(data ?? []),
    errorMessage: null,
  }
}

export async function handleShowsEndpoint(
  client: SupabaseClient,
  tourId: string,
): Promise<{ response: Response; errorMessage: string | null }> {
  if (!UUID_RE.test(tourId)) {
    return {
      response: jsonResponse({ error: "Invalid tour_id" }, 400),
      errorMessage: "Invalid tour_id",
    }
  }

  const { data: tourRow, error: tourError } = await client
    .from("tours")
    .select("tour_id, tour")
    .eq("tour_id", tourId)
    .maybeSingle()

  if (tourError) {
    return {
      response: jsonResponse({ error: "Failed to load tour" }, 500),
      errorMessage: tourError.message,
    }
  }

  if (!tourRow) {
    return {
      response: jsonResponse({ error: "Tour not found" }, 404),
      errorMessage: "Tour not found",
    }
  }

  const { rows, error } = await fetchAllRows<{
    show_date: string
    show_id: string
    show_group: string
    show_tour: string
    show_subvenue: string
    show_canonid: number | null
    show_venue_location: string
    show_detail: string | null
  }>(async (from, to) => {
    return await client
      .from("shows")
      .select(
        "show_date, show_id, show_group, show_tour, show_subvenue, show_canonid, show_venue_location, show_detail",
      )
      .eq("show_tour", tourRow.tour)
      .range(from, to)
  })

  if (error) {
    return {
      response: jsonResponse({ error: "Failed to load shows" }, 500),
      errorMessage: error,
    }
  }

  const filtered = excludeRecordingSessionShows(rows).map(
    ({
      show_detail: _showDetail,
      ...show
    }) => show,
  )

  filtered.sort(compareShowsForBotApi)

  return {
    response: successResponse(filtered),
    errorMessage: null,
  }
}

export async function handleSetlistEndpoint(
  client: SupabaseClient,
  showId: string,
): Promise<{ response: Response; errorMessage: string | null }> {
  if (!showId) {
    return {
      response: jsonResponse(
        { error: "Missing required parameter: show_id" },
        400,
      ),
      errorMessage: "Missing required parameter: show_id",
    }
  }

  if (!UUID_RE.test(showId)) {
    return {
      response: jsonResponse({ error: "Invalid show_id" }, 400),
      errorMessage: "Invalid show_id",
    }
  }

  const { data: showRow, error: showError } = await client
    .from("shows")
    .select("show_id")
    .eq("show_id", showId)
    .maybeSingle()

  if (showError) {
    return {
      response: jsonResponse({ error: "Failed to load show" }, 500),
      errorMessage: showError.message,
    }
  }

  if (!showRow) {
    return {
      response: jsonResponse({ error: "Show not found" }, 404),
      errorMessage: "Show not found",
    }
  }

  const { rows, error } = await fetchAllRows<{
    entry_id: string
    entry_set: string
    entry_setnum: number
    entry_song: string
    entry_placement: string | null
    last_count: string | null
  }>(async (from, to) => {
    return await client
      .from("setlist_entries")
      .select(
        "entry_id, entry_set, entry_setnum, entry_song, entry_placement, last_count",
      )
      .eq("entry_show", showId)
      .range(from, to)
  })

  if (error) {
    return {
      response: jsonResponse({ error: "Failed to load setlist entries" }, 500),
      errorMessage: error,
    }
  }

  rows.sort(compareSetlistEntries)

  const data = rows.map((row) => ({
    entry_id: row.entry_id,
    entry_set: row.entry_set,
    entry_setnum: row.entry_setnum,
    entry_song: row.entry_song,
    entry_placement: row.entry_placement,
    last_count: normalizeLastCount(row.last_count),
  }))

  return {
    response: successResponse(data),
    errorMessage: null,
  }
}

export async function handleSongsEndpoint(
  client: SupabaseClient,
): Promise<{ response: Response; errorMessage: string | null }> {
  const { rows, error } = await fetchAllRows<{
    song: string
    song_id: string
    song_category: string | null
    song_placeholder: boolean | null
    setlistgame_omit: boolean | null
    categories: { category_type: string } | { category_type: string }[] | null
  }>(async (from, to) => {
    return await client
      .from("songs")
      .select(
        "song, song_id, song_category, song_placeholder, setlistgame_omit, categories!inner(category_type)",
      )
      .in("categories.category_type", [...SETLIST_GAME_CATEGORY_TYPES])
      .or("setlistgame_omit.is.null,setlistgame_omit.eq.false")
      .or("song_placeholder.is.null,song_placeholder.eq.false")
      .order("song", { ascending: true })
      .range(from, to)
  })

  if (error) {
    return {
      response: jsonResponse({ error: "Failed to load songs" }, 500),
      errorMessage: error,
    }
  }

  const data = rows.map(({ song, song_id, song_category }) => ({
    song,
    song_id,
    song_category,
  }))

  return {
    response: successResponse(data),
    errorMessage: null,
  }
}
