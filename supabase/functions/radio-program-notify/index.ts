/**
 * "New Show on the Radio" — notifies opted-in devices when a new scheduled
 * program starts airing on the radio.co stream.
 *
 * Internal-only: invoked by `public.radio_program_tick()` (pg_cron) with a
 * dedicated cron secret as Bearer, and only near a program boundary (the SQL
 * gate skips mid-program ticks). Each run:
 *   1. reads the radio.co schedule, finds the program airing *now*,
 *   2. resolves it to a `wted_episodes` row (unresolved = filler → skip),
 *   3. if it's a different program than last time, sends APNs + FCM and records it.
 *
 * Copy branches on `wted_episodes.show_link`:
 *   • present (single-show) → "mm.dd.yy: group · location · venue", tap → setlist
 *   • absent (multi-show)   → "<show> · <display_name>",           tap → episode page
 *
 * Reuses ../_shared/apns.ts + ../_shared/fcm.ts. Deployed with verify_jwt: false;
 * the dedicated RADIO_PROGRAM_CRON_SECRET bearer is checked below.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import { type ApnsPayload, type ApnsTokenRow, sendApnsBatch } from "../_shared/apns.ts"
import { type FcmTokenRow, sendFcmBatch } from "../_shared/fcm.ts"
import {
  formatEpisodeScheduleTitle,
  formatLinkedShowScheduleTitle,
  type LinkedShowFields,
} from "../_shared/schedule-title.ts"

const STATION_ID = Deno.env.get("RADIO_CO_STATION_ID") ?? "s3c11c85d6"
const SCHEDULE_URL = `https://public.radio.co/stations/${STATION_ID}/embed/schedule`

serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !serviceKey) return json({ error: "Server configuration error" }, 500)

  // Only the scheduled tick may trigger this. Auth against a dedicated secret we
  // control on both sides (RADIO_PROGRAM_CRON_SECRET here and the Vault secret the
  // tick sends) — no dependence on the ambiguous/rotatable service-role key.
  const cronSecret = Deno.env.get("RADIO_PROGRAM_CRON_SECRET")?.trim()
  if (!cronSecret) return json({ error: "Server configuration error (cron secret)" }, 500)
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim()
  if (bearer !== cronSecret) return json({ error: "Unauthorized" }, 401)

  const db = createClient(supabaseUrl, serviceKey)

  // 1. The program airing right now.
  const now = Date.now()
  const events = await fetchSchedule()
  const current = events.find((e) => {
    const s = Date.parse(e.start), en = Date.parse(e.end)
    return !Number.isNaN(s) && !Number.isNaN(en) && s <= now && now < en
  })

  // 2. Resolve to a real program (a wted_episode). Unresolved = filler/rotation.
  const episode = current ? await resolveEpisode(db, current) : null
  const state = await loadState(db)

  if (!current || !episode) {
    // Keep the gate polling every minute until a real program locks in.
    await saveState(db, { current_end: null })
    return json({ ok: true, status: "no-program" }, 200)
  }

  const endISO = new Date(Date.parse(current.end)).toISOString()

  if (state?.last_event_id === current.event_id) {
    await saveState(db, { current_end: endISO }) // already notified; refresh end
    return json({ ok: true, status: "unchanged" }, 200)
  }

  // 3. New program → build branching copy + push.
  const spec = await buildSpec(db, episode)
  await sendPush(db, spec)
  await saveState(db, { last_event_id: current.event_id, current_end: endISO })
  return json({ ok: true, status: "notified", program: episode.display_name ?? episode.episode }, 200)
})

// ── radio.co schedule ─────────────────────────────────────────────────────────

interface ScheduleEvent {
  event_id: number
  start: string
  end: string
  playlist: { title?: string; name?: string | null; artwork?: string | null }
}

async function fetchSchedule(): Promise<ScheduleEvent[]> {
  try {
    const res = await fetch(SCHEDULE_URL)
    if (!res.ok) return []
    const body = await res.json()
    return (body?.data ?? []) as ScheduleEvent[]
  } catch (err) {
    console.error("radio.co schedule fetch failed:", err)
    return []
  }
}

// ── episode resolution (ports ScheduleLinkResolver's matching) ────────────────

interface EpisodeRow {
  uuid: string | null
  episode: string | null
  display_name: string | null
  show: string | null
  show_link: string | null
  status: string | null
  artwork: string | null
}

async function resolveEpisode(db: SupabaseClient, ev: ScheduleEvent): Promise<EpisodeRow | null> {
  const cols = "uuid,episode,display_name,show,show_link,status,artwork"
  const name = ev.playlist?.name?.trim()
  if (name) {
    const { data } = await db.from("wted_episodes").select(cols)
      .eq("episode", name).or("status.is.null,status.neq.REMOVED").limit(1)
    if (data && data.length) return data[0] as EpisodeRow
  }
  const rid = radioIdFromArtwork(ev.playlist?.artwork)
  if (rid) {
    const { data } = await db.from("wted_episodes").select(cols)
      .eq("radio_id", rid).or("status.is.null,status.neq.REMOVED").limit(1)
    if (data && data.length) return data[0] as EpisodeRow
  }
  return null
}

function radioIdFromArtwork(url?: string | null): string | null {
  if (!url) return null
  const m = url.match(/\/playlist\.(\d+)\./)
  return m ? m[1] : null
}

// ── push payload ──────────────────────────────────────────────────────────────

interface PushSpec { apns: ApnsPayload; fcm: Record<string, string> }
const TITLE = "Now Playing on WTED Radio"

type ShowRow = LinkedShowFields

async function buildSpec(db: SupabaseClient, ep: EpisodeRow): Promise<PushSpec> {
  // Curated episode artwork drives the push image (matches the app/wl-home-v2
  // schedule). When absent, the app's NSE attaches the bundled WL fallback, so
  // `mutableContent` is always set so the extension runs either way.
  const image = ep.artwork?.trim() || undefined
  const showLink = ep.show_link?.trim()
  if (showLink) {
    // Single-show program → concert copy, tap opens the setlist. Uses the same
    // title rules as the app schedule (mm.dd.yy · group · detail · location · venue).
    const show = await loadShow(db, showLink)
    const body = show ? formatLinkedShowScheduleTitle(show) : (ep.display_name ?? ep.episode ?? "")
    return {
      apns: { title: TITLE, body, showID: showLink, type: "radioProgram", mutableContent: true, imageUrl: image },
      fcm: { type: "radioProgram", title: TITLE, body, show_id: showLink },
    }
  }
  // Multi-show curated program → episode copy, tap opens the episode page. Same
  // rules as the app schedule (display-name-only buckets → display_name).
  const body = formatEpisodeScheduleTitle(ep.show, ep.display_name ?? ep.episode)
  const uuid = ep.uuid ?? ""
  return {
    apns: { title: TITLE, body, episodeUUID: uuid, type: "radioProgram", mutableContent: true, imageUrl: image },
    fcm: { type: "radioProgram", title: TITLE, body, episode_uuid: uuid },
  }
}

async function loadShow(db: SupabaseClient, showId: string): Promise<ShowRow | null> {
  const { data } = await db.from("shows")
    .select("show_date,show_group,show_detail,show_venue_location,show_subvenue")
    .eq("show_id", showId).maybeSingle()
  return (data as ShowRow) ?? null
}

// ── send ────────────────────────────────────────────────────────────────────

async function sendPush(db: SupabaseClient, spec: PushSpec) {
  const { data: apnsTokens, error: apnsErr } = await db
    .from("apns_tokens").select("device_token, environment").eq("radio_program_enabled", true)
  if (apnsErr) console.error("radio-program apns tokens query:", apnsErr)
  else await sendApnsBatch(db, (apnsTokens ?? []) as ApnsTokenRow[], spec.apns)

  try {
    const { data: fcmTokens, error: fcmErr } = await db
      .from("fcm_tokens").select("fcm_token").eq("radio_program_enabled", true)
    if (fcmErr) console.error("radio-program fcm tokens query:", fcmErr)
    else await sendFcmBatch(db, (fcmTokens ?? []) as FcmTokenRow[], spec.fcm)
  } catch (err) {
    console.error("radio-program FCM fan-out failed:", err)
  }
}

// ── state ─────────────────────────────────────────────────────────────────────

interface State { last_event_id: number | null; current_end: string | null }

async function loadState(db: SupabaseClient): Promise<State | null> {
  const { data } = await db.from("radio_program_state")
    .select("last_event_id,current_end").eq("id", true).maybeSingle()
  return (data as State) ?? null
}

async function saveState(db: SupabaseClient, patch: Partial<State>) {
  await db.from("radio_program_state")
    .update({ ...patch, updated_at: new Date().toISOString() }).eq("id", true)
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}
