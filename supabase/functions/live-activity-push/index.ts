/**
 * Send APNs "liveactivity" pushes for the setlist Live Activity.
 *
 * Internal-only — called by the DB (pg_net) with the service-role key as Bearer.
 * Body: { event: "start" | "update" | "end", show_id }.
 *   • start  → all push-to-start tokens (begins the activity with the app closed)
 *   • update → a show's per-activity tokens (new song)
 *   • end    → dismisses + deletes that show's update tokens
 *
 * Reuses ../_shared/apns.ts for the ES256 JWT + dead-token detection; only the
 * liveactivity payload/headers are specific here.
 *
 * Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, plus the shared
 * APNS_KEY_ID / APNS_TEAM_ID / APNS_PRIVATE_KEY / APNS_BUNDLE_ID.
 * Deploy with verify_jwt: true (the service-role bearer is also checked below).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getApnsConfig, isDeadTokenReason, type ApnsConfig } from "../_shared/apns.ts"

const WINDOW_HOURS = 5 // must match the app's live-show window
const IMPROV_JAM = "[Improv/Jam]"
const PROD_HOST = "https://api.push.apple.com"
const SANDBOX_HOST = "https://api.sandbox.push.apple.com"

serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !serviceKey) return json({ error: "Server configuration error" }, 500)

  // Internal caller only (the trigger/cron sends the service-role key).
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim()
  if (bearer !== serviceKey) return json({ error: "Unauthorized" }, 401)

  let event = ""
  let showId = ""
  try {
    const b = await req.json()
    event = String(b.event ?? "")
    showId = String(b.show_id ?? "")
  } catch {
    return json({ error: "Invalid JSON body" }, 400)
  }
  if (!showId || !["start", "update", "end"].includes(event)) {
    return json({ error: "event and show_id required" }, 400)
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const show = await loadShow(supabase, showId)
  if (!show) return json({ error: "Show not found" }, 404)

  const apns = await getApnsConfig()
  if (!apns.ok) {
    console.error("live-activity-push APNs config:", apns.error)
    return json({ error: apns.error }, 500)
  }
  const config = apns.config

  const state = latestSong(await loadEntries(supabase, showId)) ??
    { songName: "Show starting…", setLabel: "", songNumber: 0, songCount: 0 }
  const attributes = {
    showID: show.show_id,
    showDate: formatDate(show.show_date),
    location: show.show_venue_location ?? "",
    venue: show.show_subvenue ?? "",
  }
  const nowSec = Math.floor(Date.now() / 1000)
  const startSec = showStartSec(show)
  const staleSec = startSec ? startSec + WINDOW_HOURS * 3600 : nowSec + 3600

  if (event === "start") {
    const tokens = await tokenRows(supabase, "live_activity_start_tokens")
    const payload = {
      aps: {
        timestamp: nowSec,
        event: "start",
        "content-state": state,
        "attributes-type": "SetlistActivityAttributes",
        attributes,
        "stale-date": staleSec,
        alert: {
          title: "Show started",
          body: [attributes.venue, attributes.location].filter(Boolean).join(" — "),
        },
      },
    }
    const result = await fanOut(supabase, "live_activity_start_tokens", tokens, payload, config)
    await supabase.from("live_activity_show_state")
      .upsert({ show_id: showId, started_at: new Date().toISOString() }, { onConflict: "show_id" })
    return json({ ok: true, ...result }, 200)
  }

  if (event === "update") {
    const tokens = await tokenRows(supabase, "live_activity_update_tokens", showId)
    const payload = {
      aps: { timestamp: nowSec, event: "update", "content-state": state, "stale-date": staleSec },
    }
    const result = await fanOut(supabase, "live_activity_update_tokens", tokens, payload, config)
    return json({ ok: true, ...result }, 200)
  }

  // event === "end"
  const tokens = await tokenRows(supabase, "live_activity_update_tokens", showId)
  const payload = {
    aps: { timestamp: nowSec, event: "end", "content-state": state, "dismissal-date": nowSec + 300 },
  }
  const result = await fanOut(supabase, "live_activity_update_tokens", tokens, payload, config)
  await supabase.from("live_activity_update_tokens").delete().eq("show_id", showId)
  return json({ ok: true, ...result }, 200)
})

// ── Data ────────────────────────────────────────────────────────────────────

interface Show {
  show_id: string
  show_date: string | null
  show_time: string | null
  show_subvenue: string | null
  show_venue_location: string | null
}
interface Entry {
  entry_set: string | null
  entry_setnum: number | null
  entry_song: string
  songs: { song_displayname: string | null } | null
}
interface TokenRow { token: string; environment: string | null }

async function loadShow(db: SupabaseClient, showId: string): Promise<Show | null> {
  const { data } = await db
    .from("shows")
    .select("show_id,show_date,show_time,show_subvenue,show_venue_location")
    .eq("show_id", showId)
    .maybeSingle()
  return (data as Show) ?? null
}

async function loadEntries(db: SupabaseClient, showId: string): Promise<Entry[]> {
  const { data } = await db
    .from("setlist_entries")
    .select("entry_set,entry_setnum,entry_song,songs(song_displayname)")
    .eq("entry_show", showId)
  return (data as Entry[]) ?? []
}

async function tokenRows(db: SupabaseClient, table: string, showId?: string): Promise<TokenRow[]> {
  let q = db.from(table).select("token,environment")
  if (showId) q = q.eq("show_id", showId)
  const { data } = await q
  return (data as TokenRow[]) ?? []
}

// ── latest-song — ports SetlistLiveActivityController.latestSong + SetlistDisplay ──

function setSortRank(set: string): [number, number, string] {
  const s = set.trim()
  if (s.startsWith("E")) {
    const n = parseInt(s.slice(1), 10)
    if (!isNaN(n)) return [1, n, s]
  }
  const n = parseInt(s, 10)
  if (!isNaN(n) && String(n) === s) return [0, n, s]
  return [2, 0, s]
}

function setLabel(set: string): string {
  const s = set.trim()
  if (s === "E1") return "Encore"
  if (s === "E2") return "2nd Encore"
  if (s === "E3") return "3rd Encore"
  if (s.startsWith("E")) {
    const n = parseInt(s.slice(1), 10)
    if (!isNaN(n)) return `Encore ${n}`
  }
  const n = parseInt(s, 10)
  if (!isNaN(n) && String(n) === s) return `Set ${s}`
  return s
}

function latestSong(entries: Entry[]) {
  const real = entries.filter((e) => e.entry_song !== IMPROV_JAM)
  if (real.length === 0) return null
  const key = (e: Entry): [number, number, string, number] => {
    const [a, b, c] = setSortRank(e.entry_set ?? "")
    return [a, b, c, e.entry_setnum ?? 0]
  }
  const cmp = (x: [number, number, string, number], y: [number, number, string, number]) =>
    x[0] !== y[0] ? x[0] - y[0]
      : x[1] !== y[1] ? x[1] - y[1]
        : x[2] !== y[2] ? (x[2] < y[2] ? -1 : 1)
          : x[3] - y[3]
  let last = real[0]
  for (const e of real) if (cmp(key(e), key(last)) > 0) last = e
  return {
    songName: last.songs?.song_displayname ?? last.entry_song,
    setLabel: setLabel(last.entry_set ?? ""),
    songNumber: last.entry_setnum ?? real.length,
    songCount: real.length,
  }
}

function showStartSec(show: Show): number | null {
  if (!show.show_time) return null
  const t = Date.parse(show.show_time)
  return isNaN(t) ? null : Math.floor(t / 1000)
}

function formatDate(raw: string | null): string {
  if (!raw) return ""
  const d = new Date(`${raw.slice(0, 10)}T00:00:00Z`)
  if (isNaN(d.getTime())) return raw
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })
}

// ── APNs liveactivity transport ─────────────────────────────────────────────

async function fanOut(
  db: SupabaseClient,
  table: string,
  rows: TokenRow[],
  payload: unknown,
  config: ApnsConfig,
) {
  let sent = 0, failed = 0, removed = 0
  for (const row of rows) {
    try {
      const r = await sendLiveActivity(row.token, row.environment, config, payload)
      if (r.status === 200) { sent += 1; continue }
      failed += 1
      if (isDeadTokenReason(r.status, r.reason)) {
        const { error } = await db.from(table).delete().eq("token", row.token)
        if (!error) removed += 1
      } else {
        console.error(`APNs ${r.status}${r.reason ? ` (${r.reason})` : ""} for ${row.token.slice(0, 8)}…`)
      }
    } catch (err) {
      failed += 1
      console.warn("live-activity-push send failed:", err)
    }
  }
  return { attempted: rows.length, sent, failed, removed }
}

async function sendLiveActivity(
  token: string,
  environment: string | null,
  config: ApnsConfig,
  payload: unknown,
): Promise<{ status: number; reason?: string }> {
  const host = environment === "sandbox" ? SANDBOX_HOST : PROD_HOST
  const res = await fetch(`${host}/3/device/${token}`, {
    method: "POST",
    headers: {
      authorization: `bearer ${config.jwt}`,
      "apns-topic": `${config.bundleId}.push-type.liveactivity`,
      "apns-push-type": "liveactivity",
      "apns-priority": "10",
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  })
  if (res.status === 200) {
    await res.text().catch(() => undefined)
    return { status: 200 }
  }
  let reason: string | undefined
  try {
    reason = (JSON.parse(await res.text()) as { reason?: string }).reason
  } catch {
    reason = undefined
  }
  return { status: res.status, reason }
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}
