/**
 * READ-ONLY audit of Radio.co Studio playlist membership.
 *
 * Purpose: answer "which playlists is each track in?" so `wted_radio_ids.show_id`
 * (concerts) and a future `wted_show_id` (compilations) can be populated from
 * ground truth rather than parsed from track titles. Title parsing was tried and
 * is unreliable — an intro whose artist field reads `2024/04/24 Clune Auditorium`
 * turned out to belong to a COMPILATION, not a concert.
 *
 * This function NEVER touches the database. It deliberately does not import
 * `@supabase/supabase-js`, so "read-only" is structural rather than a promise.
 * The caller joins the returned membership against Postgres itself.
 *
 * Why this exists instead of calling `radio-co-playlists` with `action: "get"`
 * 720 times: `getRadioCoSessionCookie()` performs a FRESH Radio.co login on
 * every invocation, and Radio.co answers login abuse with HTTP 429
 * (`radio-co-session.ts`). One login per playlist would lock the account out.
 * Here a single login serves a whole chunk.
 *
 * Membership is only readable one playlist at a time: the collection endpoint
 * omits `items`, the `Track` schema carries no playlist field, and
 * `GET /tracks` has no playlist filter. Confirmed against Radio.co's OpenAPI
 * spec. So the crawl is inherently N requests for N playlists, and must be
 * chunked to stay inside the function wall clock.
 *
 * Usage — send the service-role key in the `apikey` header, NOT in
 * `Authorization` (see the gate below for why):
 *   POST { "action": "list" }
 *     -> { total, playlists: [{ id, name, num_items }] }   // 1 request, plan the crawl
 *   POST { "action": "items", "offset": 0, "count": 40 }
 *     -> { total, offset, returned, nextOffset, playlists: [{ id, name, items }] }
 *
 * Delete this function once the audit CSVs are generated.
 */
import { corsHeaders } from "../_shared/cors.ts"
import { getRadioCoSessionCookie, RADIO_CO_STUDIO_API_V1 } from "../_shared/radio-co-session.ts"

/**
 * Duplicated from `_shared/wted-radio-ids-sync.ts` on purpose: that module
 * type-imports the Supabase client, and this function's whole guarantee is that
 * it carries no database dependency whatsoever.
 */
const STATION_ID = "s3c11c85d6"

const STUDIO_PLAYLISTS_URL =
  `${RADIO_CO_STUDIO_API_V1}/stations/${STATION_ID}/playlists` as const

/** Playlists fetched concurrently. Low on purpose: Radio.co documents no rate
 *  limit at all, so there is no published budget to spend against. */
const CONCURRENCY = 4

/** Default playlists per invocation. ~40 × ~4 concurrent stays well inside the
 *  wall clock with room for retries. */
const DEFAULT_COUNT = 40
const MAX_COUNT = 120

/**
 * Stop starting new fetches after this long and report `nextOffset` instead of
 * dying mid-chunk. A truncated-but-honest response is resumable; a timeout is not.
 */
const SOFT_DEADLINE_MS = 100_000

const MAX_ATTEMPTS = 3

type PlaylistItem = {
  position?: number
  /** `track` for a real track; other values are dynamic blocks (see `tag_id`). */
  type?: string
  track_id?: number
  /**
   * Present on tag blocks — the "WTED Station ID" / "WTED Bumper" slots that
   * Radio.co fills with a RANDOM tagged track at play time. Such a play is not
   * playlist membership, which is why the raw item shape is preserved here
   * rather than flattened to a list of track ids.
   */
  tag_id?: number
}

type Playlist = {
  id: number
  name: string
  num_items?: number
  /** Only returned by the single-playlist endpoint, never by the collection. */
  items?: PlaylistItem[]
}

type PlaylistEnvelope = { playlists?: unknown }

type PlaylistResult = {
  id: number
  name: string
  /** Radio.co's own count, for cross-checking against `items.length`. */
  num_items: number | null
  items: PlaylistItem[]
  /** Set when this playlist could not be read; `items` is then meaningless. */
  error?: string
}

function err(message: string, status: number, extra?: Record<string, unknown>) {
  return new Response(JSON.stringify({ error: message, ...extra }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

/** Length-independent compare so the gate can't be probed by timing. */
function secretsMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function bearerToken(header: string | null): string | null {
  if (!header?.startsWith("Bearer ")) return null
  return header.slice(7).trim() || null
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * GET a Studio URL as JSON, retrying transient failures.
 *
 * 429 and 5xx are retried with backoff; 4xx other than 429 is returned to the
 * caller as a per-playlist error, since retrying a 404 just burns the clock.
 */
async function studioGet(url: string, cookie: string): Promise<PlaylistEnvelope> {
  let lastError = "unknown error"

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let res: Response
    try {
      res = await fetch(url, { headers: { Cookie: cookie, Accept: "application/json" } })
    } catch (e) {
      lastError = `network error: ${e instanceof Error ? e.message : String(e)}`
      await sleep(500 * attempt)
      continue
    }

    if (res.ok) {
      const text = await res.text()
      if (!text.trim()) throw new Error("empty response body")
      try {
        return JSON.parse(text) as PlaylistEnvelope
      } catch {
        throw new Error("response was not valid JSON")
      }
    }

    const detail = (await res.text()).slice(0, 200)
    lastError = `HTTP ${res.status}: ${detail}`

    if (res.status === 429 || res.status >= 500) {
      // Honour Retry-After when Radio.co sends one; the spec documents no rate
      // limit, so treat any hint it gives as more trustworthy than our guess.
      const retryAfter = Number(res.headers.get("retry-after"))
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 10_000)
        : 750 * attempt
      await sleep(waitMs)
      continue
    }

    throw new Error(lastError)
  }

  throw new Error(`gave up after ${MAX_ATTEMPTS} attempts — ${lastError}`)
}

/** The playlist collection: every playlist, no items. */
async function fetchAllPlaylists(cookie: string): Promise<Playlist[]> {
  const envelope = await studioGet(STUDIO_PLAYLISTS_URL, cookie)
  if (!Array.isArray(envelope.playlists)) {
    throw new Error("Invalid Radio.co response: missing playlists array")
  }
  return envelope.playlists as Playlist[]
}

/**
 * One playlist's items.
 *
 * `items` is NOT in Radio.co's published `Playlist` schema — it was
 * reverse-engineered from Studio's browser traffic. A missing array therefore
 * means "the undocumented shape changed", which must surface as an error rather
 * than as an empty membership list: silently returning `[]` would read as
 * "this track is in no playlist" and quietly null out good data downstream.
 */
async function fetchPlaylistItems(cookie: string, playlist: Playlist): Promise<PlaylistResult> {
  const base = {
    id: playlist.id,
    name: playlist.name,
    num_items: typeof playlist.num_items === "number" ? playlist.num_items : null,
  }

  try {
    const envelope = await studioGet(`${STUDIO_PLAYLISTS_URL}/${playlist.id}`, cookie)
    const list = Array.isArray(envelope.playlists) ? (envelope.playlists as Playlist[]) : []
    const full = list[0]

    if (!full) return { ...base, items: [], error: "playlist not present in response" }
    if (!Array.isArray(full.items)) {
      return { ...base, items: [], error: "response carried no `items` array" }
    }

    return {
      ...base,
      name: full.name ?? playlist.name,
      num_items: typeof full.num_items === "number" ? full.num_items : base.num_items,
      items: full.items,
    }
  } catch (e) {
    return { ...base, items: [], error: e instanceof Error ? e.message : String(e) }
  }
}

/** Fixed-size worker pool; preserves input order in the output array. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const out = new Array<R>(items.length)
  let next = 0

  async function worker() {
    for (;;) {
      const i = next++
      if (i >= items.length) return
      out[i] = await fn(items[i], i)
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return out
}

function parseIntInRange(raw: unknown, fallback: number, min: number, max: number): number {
  const n = typeof raw === "number" ? raw : Number(raw)
  if (!Number.isFinite(n)) return fallback
  return Math.min(Math.max(Math.trunc(n), min), max)
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return err("Method not allowed", 405)

  // Service-role gate. The Supabase gateway has already authorized the request;
  // this check narrows it to service_role specifically, so the anon key (which
  // every browser has) cannot reach Radio.co through here.
  //
  // This project's service key is the newer `sb_secret_…` format, which is NOT a
  // JWT. The gateway rejects those in `Authorization` outright — "Conflicting API
  // keys … send the intended sb_ key only in the `apikey` header" — so `apikey`
  // is the primary source here. The bearer fallback keeps the function working if
  // the project is ever rolled back to legacy JWT service keys.
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!serviceKey) return err("Server configuration error", 500)

  const presented = req.headers.get("apikey")?.trim()
    || bearerToken(req.headers.get("authorization"))
  if (!presented || !secretsMatch(presented, serviceKey)) return err("Unauthorized", 401)

  let body: Record<string, unknown> = {}
  try {
    const text = await req.text()
    if (text.trim()) body = JSON.parse(text) as Record<string, unknown>
  } catch {
    return err("Invalid request body", 400)
  }

  const action = typeof body.action === "string" ? body.action : "items"
  if (action !== "list" && action !== "items") {
    return err(`Unknown action: ${action}`, 400, { supported: ["list", "items"] })
  }

  let cookie: string
  try {
    cookie = await getRadioCoSessionCookie()
  } catch (e) {
    return err("Failed to authenticate with Radio.co", 502, {
      message: e instanceof Error ? e.message : String(e),
    })
  }

  let all: Playlist[]
  try {
    all = await fetchAllPlaylists(cookie)
  } catch (e) {
    return err("Failed to list Radio.co playlists", 502, {
      message: e instanceof Error ? e.message : String(e),
    })
  }

  // Stable order so `offset` means the same thing across invocations — the
  // collection's own order is not guaranteed and `position` is mutable in Studio.
  all.sort((a, b) => a.id - b.id)

  if (action === "list") {
    return ok({
      total: all.length,
      playlists: all.map((p) => ({
        id: p.id,
        name: p.name,
        num_items: typeof p.num_items === "number" ? p.num_items : null,
      })),
    })
  }

  const offset = parseIntInRange(body.offset, 0, 0, Number.MAX_SAFE_INTEGER)
  const count = parseIntInRange(body.count, DEFAULT_COUNT, 1, MAX_COUNT)
  const slice = all.slice(offset, offset + count)

  const startedAt = Date.now()
  let deadlineHit = false

  const results = await mapWithConcurrency(slice, CONCURRENCY, async (playlist) => {
    if (Date.now() - startedAt > SOFT_DEADLINE_MS) {
      deadlineHit = true
      return null
    }
    return await fetchPlaylistItems(cookie, playlist)
  })

  const playlists = results.filter((r): r is PlaylistResult => r !== null)
  const failed = playlists.filter((p) => p.error).length
  const consumed = offset + playlists.length

  return ok({
    total: all.length,
    offset,
    requested: slice.length,
    returned: playlists.length,
    // Null means the crawl reached the end of the collection.
    nextOffset: consumed < all.length ? consumed : null,
    deadlineHit,
    failed,
    elapsedMs: Date.now() - startedAt,
    playlists,
  })
})
