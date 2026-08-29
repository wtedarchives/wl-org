/**
 * TRMNL e-ink device feed.
 *
 * One JSON document for a two-column 800x480 screen. The left column is always
 * now-playing on WTED Goose Radio; the right column is today's radio schedule,
 * or — when a Goose show is inside its live window — that show's setlist.
 * Shaping lives in `_shared/trmnl-feed/payload.ts` so the site's dev preview
 * page renders the identical payload.
 *
 * Auth: X-API-Key header or `Authorization: Bearer <api-key>`, validated
 * against `public.bot_api_keys` — the same custom keys `bot-read-api` uses.
 * Create one with `generate_bot_api_key('trmnl')`.
 *
 * GET /trmnl-feed
 *   ?tz=America/New_York   station timezone; sets the "today" boundary
 *   ?mode=schedule|setlist force the right column (preview/debug)
 *   ?show_id=<uuid>        pin a specific show, ignoring the live window
 *   ?at=<iso8601>          evaluate as if it were this instant
 *
 * Radio.co is the source for both now-playing and the schedule (the site reads
 * the same public endpoints), so the common no-show-live case touches Supabase
 * only for the key check.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

import {
  BOT_READ_API_CORS,
  createServiceClient,
  extractApiKey,
  jsonResponse,
  logBotApiRequest,
  touchApiKeyLastUsed,
  UUID_RE,
  validateApiKey,
} from "../_shared/bot-read-api-utils.ts"
import {
  buildTrmnlPayload,
  currentScheduleSlot,
  isShowLive,
  selectScheduleSlots,
  TRMNL_DEFAULT_TZ,
  TRMNL_LIVE_WINDOW_MS,
  type RadioCoScheduleEventInput,
  type RadioCoStatusInput,
  type TrmnlSetlistEntryInput,
  type TrmnlShowInput,
} from "../_shared/trmnl-feed/payload.ts"
import {
  resolveNowPlayingArtwork,
  resolveScheduleTitles,
  type TrmnlFetchRows,
} from "../_shared/trmnl-feed/lookups.ts"

const RADIO_CO_STATION_ID = "s3c11c85d6"
const RADIO_CO_STATUS_URL = `https://public.radio.co/stations/${RADIO_CO_STATION_ID}/status`
const RADIO_CO_SCHEDULE_URL = `https://public.radio.co/stations/${RADIO_CO_STATION_ID}/embed/schedule`

/** Radio.co caches for ~3s; the device polls minutes apart. Fail fast instead. */
const UPSTREAM_TIMEOUT_MS = 8000

const SHOW_COLUMNS =
  "show_id,show_date,show_time,show_tour,show_subvenue,show_venue_location"

const SETLIST_COLUMNS =
  "entry_set,entry_setnum,entry_song,entry_short,entry_segue,entry_setorder,songs ( song_displayname )"

/** A dead upstream degrades one column rather than failing the whole screen. */
async function fetchJson<T>(url: string): Promise<T | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch (err) {
    console.error(`trmnl-feed upstream failed (${url}):`, String(err))
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz })
    return true
  } catch {
    return false
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: BOT_READ_API_CORS })
  }

  const startedAt = Date.now()
  const url = new URL(req.url)
  const queryParams: Record<string, string> = {}
  url.searchParams.forEach((value, key) => {
    queryParams[key] = value
  })

  let apiKeyId: string | null = null
  let response = jsonResponse({ error: "Internal error" }, 500)
  let errorMessage: string | null = null

  const client = createServiceClient()

  try {
    if (!client) {
      errorMessage = "Server configuration error"
      response = jsonResponse({ error: errorMessage }, 500)
      return response
    }

    if (req.method !== "GET") {
      errorMessage = "Method not allowed"
      response = jsonResponse({ error: errorMessage }, 405)
      return response
    }

    const rawKey = extractApiKey(req)
    if (!rawKey) {
      errorMessage = "Unauthorized"
      response = jsonResponse({ error: errorMessage }, 401)
      return response
    }

    const { key, error: keyError } = await validateApiKey(client, rawKey)
    if (keyError) {
      errorMessage = keyError
      response = jsonResponse({ error: "Internal error" }, 500)
      return response
    }
    if (!key) {
      errorMessage = "Unauthorized"
      response = jsonResponse({ error: errorMessage }, 401)
      return response
    }
    apiKeyId = key.id

    const tzParam = url.searchParams.get("tz")?.trim()
    const tz = tzParam && isValidTimeZone(tzParam) ? tzParam : TRMNL_DEFAULT_TZ

    const atParam = url.searchParams.get("at")?.trim()
    const atMs = atParam ? new Date(atParam).getTime() : Number.NaN
    const nowMs = Number.isNaN(atMs) ? Date.now() : atMs

    const modeParam = url.searchParams.get("mode")?.trim().toLowerCase()
    if (modeParam && modeParam !== "schedule" && modeParam !== "setlist") {
      errorMessage = "Invalid mode. Use mode=schedule|setlist"
      response = jsonResponse({ error: errorMessage }, 400)
      return response
    }

    const showIdParam = url.searchParams.get("show_id")?.trim()
    if (showIdParam && !UUID_RE.test(showIdParam)) {
      errorMessage = "Invalid show_id"
      response = jsonResponse({ error: errorMessage }, 400)
      return response
    }

    const [status, scheduleRes] = await Promise.all([
      fetchJson<
        RadioCoStatusInput & {
          current_track?: { artwork_url?: string | null } | null
        }
      >(RADIO_CO_STATUS_URL),
      fetchJson<{ data?: RadioCoScheduleEventInput[] }>(RADIO_CO_SCHEDULE_URL),
    ])

    // `mode=schedule` short-circuits the show lookup entirely; otherwise find
    // the show whose six-hour live window contains `now`, the same rule as
    // LiveShowMonitor.swift and the la-start-scan cron.
    let show: TrmnlShowInput | null = null
    if (modeParam !== "schedule") {
      const query = client.from("shows").select(SHOW_COLUMNS)
      const { data, error } =
        showIdParam ?
          await query.eq("show_id", showIdParam).limit(1)
        : await query
            .lte("show_time", new Date(nowMs).toISOString())
            .gte("show_time", new Date(nowMs - TRMNL_LIVE_WINDOW_MS).toISOString())
            .order("show_time", { ascending: false })
            .limit(1)

      if (error) {
        errorMessage = error.message
        response = jsonResponse({ error: "Internal error" }, 500)
        return response
      }

      const row = data?.[0] as (TrmnlShowInput & { show_time: string | null }) | undefined
      // An explicit show_id or mode=setlist is a deliberate override; without
      // one the window still has to agree, so a stale poll can't pin a show.
      const forced = Boolean(showIdParam) || modeParam === "setlist"
      if (row && (forced || isShowLive(row.show_time, nowMs))) {
        show = row
      }
    }

    let setlist: TrmnlSetlistEntryInput[] = []
    if (show) {
      const { data, error } = await client
        .from("setlist_entries")
        .select(SETLIST_COLUMNS)
        .eq("entry_show", show.show_id)
        .order("entry_setorder", { ascending: true })

      if (error) {
        errorMessage = error.message
        response = jsonResponse({ error: "Internal error" }, 500)
        return response
      }
      setlist = (data ?? []) as TrmnlSetlistEntryInput[]
    }

    // Titles and the now-playing cover both come from the database, so slots
    // are selected first, resolved, then handed to the pure builder.
    const slots = selectScheduleSlots(scheduleRes?.data ?? [], nowMs, tz)
    const onAir = currentScheduleSlot(slots, nowMs)
    const onAirIndex = onAir ? slots.indexOf(onAir) : -1

    const fetchRows: TrmnlFetchRows = async (
      table,
      columns,
      filterColumn,
      values,
    ) => {
      const { data, error } = await client
        .from(table)
        .select(columns)
        .in(filterColumn, values)
      if (error) throw new Error(error.message)
      // `select()` takes a runtime string here, so supabase-js cannot infer a
      // row type and widens to its error shape. The adapter's contract is the
      // untyped row bag `lookups.ts` expects.
      return (data ?? []) as unknown as Array<Record<string, unknown>>
    }

    const resolution = await resolveScheduleTitles(slots, onAirIndex, fetchRows)

    const trackArtwork = await resolveNowPlayingArtwork(
      {
        radioCoArtworkUrl: status?.current_track?.artwork_url ?? null,
        trackTitle: status?.current_track?.title ?? null,
        onAirEpisodeArtwork: resolution.onAirEpisodeArtwork,
        onAirShowLink: resolution.onAirShowLink,
      },
      fetchRows,
    )

    const payload = buildTrmnlPayload({
      status,
      slots,
      slotTitles: resolution.titles,
      trackArtwork,
      show,
      setlist,
      nowMs,
      tz,
    })

    response = jsonResponse(payload as unknown as Record<string, unknown>, 200)
    return response
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err)
    response = jsonResponse({ error: "Internal error" }, 500)
    return response
  } finally {
    if (client) {
      if (apiKeyId) void touchApiKeyLastUsed(client, apiKeyId)
      void logBotApiRequest(client, {
        apiKeyId,
        endpoint: "trmnl-feed",
        queryParams,
        statusCode: response.status,
        errorMessage,
        durationMs: Date.now() - startedAt,
      })
    }
  }
})
