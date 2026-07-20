/**
 * Setlist Game "picks lock soon" reminders. Invoked every 15 min by pg_cron
 * (via pg_net). Finds shows whose picks lock (show_time − 1h) is approaching and
 * sends an APNs push to devices opted into Setlist Game reminders — once per show
 * (deduped via the setlist_game_reminders table).
 *
 * Fires when a show's show_time is 1–2h out (so the lock is <1h away). The cron
 * pings this with no body; auth is the service-role key in the Authorization
 * header (set from Vault), checked against this function's own env.
 *
 * Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, APNS_* (see _shared/apns.ts)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"
import { type ApnsTokenRow, sendApnsBatch } from "../_shared/apns.ts"
import { type FcmTokenRow, sendFcmBatch } from "../_shared/fcm.ts"
import {
  formatShowDateVenueLine,
  getSetlistArchiveAbsoluteUrl,
} from "../_shared/discourse-brains-chat.ts"

type ShowRow = {
  show_id: string
  show_date: string | null
  show_venue_location: string | null
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !serviceKey) return json({ error: "Server configuration error" }, 500)

  // Only the scheduled cron may trigger this. Auth against a dedicated secret we
  // control on both sides (the SETLIST_GAME_CRON_SECRET env here and the Vault
  // secret the cron sends) — no dependence on the ambiguous service-role key.
  const cronSecret = Deno.env.get("SETLIST_GAME_CRON_SECRET")?.trim()
  if (!cronSecret) return json({ error: "Server configuration error (cron secret)" }, 500)
  const provided = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim()
  if (provided !== cronSecret) return json({ error: "Unauthorized" }, 401)

  const db = createClient(supabaseUrl, serviceKey)

  // Window: show_time is 1–2h away → picks lock (show_time−1h) is <1h out.
  const now = Date.now()
  const lower = new Date(now + 60 * 60 * 1000).toISOString() // +1h
  const upper = new Date(now + 2 * 60 * 60 * 1000).toISOString() // +2h

  const { data: showsData, error: showsError } = await db
    .from("shows")
    .select("show_id, show_date, show_venue_location")
    .not("show_time", "is", null)
    .gt("show_time", lower)
    .lte("show_time", upper)

  if (showsError) {
    console.error("setlist-game-reminders shows query:", showsError)
    return json({ error: showsError.message }, 500)
  }

  const shows = (showsData ?? []) as ShowRow[]
  if (shows.length === 0) return json({ checked: 0, reminded: 0 }, 200)

  // Drop shows we've already reminded about.
  const showIds = shows.map((s) => s.show_id)
  const { data: sentRows } = await db
    .from("setlist_game_reminders")
    .select("show_id")
    .in("show_id", showIds)
  const alreadySent = new Set((sentRows ?? []).map((r) => r.show_id as string))
  const pending = shows.filter((s) => !alreadySent.has(s.show_id))
  if (pending.length === 0) return json({ checked: shows.length, reminded: 0 }, 200)

  const { data: tokensData, error: tokensError } = await db
    .from("apns_tokens")
    .select("device_token, environment")
    .eq("setlist_game_enabled", true)
  if (tokensError) {
    console.error("setlist-game-reminders tokens query:", tokensError)
    return json({ error: tokensError.message }, 500)
  }
  const tokens = (tokensData ?? []) as ApnsTokenRow[]

  // Android (FCM) opt-ins, queried once. Fan-out is additive and isolated so an
  // FCM issue never blocks the APNs path or the dedupe bookkeeping.
  const { data: fcmData, error: fcmError } = await db
    .from("fcm_tokens")
    .select("fcm_token")
    .eq("setlist_game_enabled", true)
  if (fcmError) console.error("setlist-game-reminders FCM tokens query:", fcmError)
  const fcmTokens = (fcmData ?? []) as FcmTokenRow[]

  let reminded = 0
  for (const show of pending) {
    const result = await sendApnsBatch(db, tokens, {
      title: "Setlist Game Picks Lock Soon",
      body: formatShowDateVenueLine(show.show_date ?? "", show.show_venue_location),
      showID: show.show_id,
      url: getSetlistArchiveAbsoluteUrl(show.show_id),
      type: "setlistGame",
    })
    try {
      await sendFcmBatch(db, fcmTokens, {
        type: "setlistGame",
        title: "Setlist Game Picks Lock Soon",
        body: formatShowDateVenueLine(show.show_date ?? "", show.show_venue_location),
        show_id: show.show_id,
      })
    } catch (err) {
      console.error("setlist-game-reminders FCM fan-out failed:", err)
    }
    // Log the show as reminded unless APNs itself is unconfigured (so it retries
    // once secrets are set). "no registered devices" still counts as done.
    const configMissing = result.skipped != null && result.skipped !== "no registered devices"
    if (!configMissing) {
      await db.from("setlist_game_reminders").upsert(
        { show_id: show.show_id },
        { onConflict: "show_id", ignoreDuplicates: true },
      )
      reminded += 1
    }
  }

  return json({ checked: shows.length, reminded }, 200)
})

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}
