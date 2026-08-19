/**
 * Provisional Setlist Game scoring after a setlist add/remove/edit.
 *
 * Internal-only — pg_net (trigger + 1-min drain cron) sends
 * `{ show_id }` with Bearer SETLIST_GAME_CRON_SECRET (same secret as
 * setlist-game-reminders / Vault `setlist_game_cron_key`).
 *
 * Coalesces rapid setlist edits via setlist_game_recalc_queue.in_flight.
 * Never writes `score` or sets `show_scored`.
 *
 * Deployed with verify_jwt: false; the cron secret is checked below.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"
import { scoreSetlistGameShow } from "../_shared/setlist-game-scoring.ts"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !serviceKey) {
    return json({ error: "Server configuration error" }, 500)
  }

  const cronSecret = Deno.env.get("SETLIST_GAME_CRON_SECRET")?.trim()
  if (!cronSecret) {
    return json({ error: "Server configuration error (cron secret)" }, 500)
  }
  const provided = (req.headers.get("authorization") ?? "")
    .replace(/^Bearer\s+/i, "")
    .trim()
  if (provided !== cronSecret) return json({ error: "Unauthorized" }, 401)

  let showId = ""
  try {
    const body = await req.json()
    showId = String(body.show_id ?? "").trim()
  } catch {
    return json({ error: "Invalid JSON body" }, 400)
  }
  if (!UUID_RE.test(showId)) return json({ error: "show_id required" }, 400)

  const db = createClient(supabaseUrl, serviceKey)

  const { data: show, error: showErr } = await db
    .from("shows")
    .select("show_id, show_scored, show_issetlistgame")
    .eq("show_id", showId)
    .maybeSingle()
  if (showErr) return json({ error: showErr.message }, 500)
  if (!show?.show_issetlistgame) {
    await clearQueue(db, showId)
    return json({ skipped: "not_game" }, 200)
  }
  if (show.show_scored) {
    await clearQueue(db, showId)
    return json({ skipped: "scored" }, 200)
  }

  const { data: claimed } = await db
    .from("setlist_game_recalc_queue")
    .update({ in_flight: true })
    .eq("show_id", showId)
    .eq("in_flight", false)
    .select("requested_at")
    .maybeSingle()
  if (!claimed) return json({ skipped: "busy" }, 200)

  let runs = 0
  for (let i = 0; i < 5; i++) {
    const started = new Date().toISOString()
    const scored = await scoreSetlistGameShow(db, showId, "provisional")
    runs += 1
    if (scored.error) {
      await clearQueue(db, showId)
      return json({ error: scored.error, runs }, 500)
    }
    const { data: row } = await db
      .from("setlist_game_recalc_queue")
      .select("requested_at")
      .eq("show_id", showId)
      .maybeSingle()
    if (!row) break
    const requestedAt = new Date(row.requested_at as string).getTime()
    if (!Number.isFinite(requestedAt) || requestedAt <= Date.parse(started)) {
      await db
        .from("setlist_game_recalc_queue")
        .delete()
        .eq("show_id", showId)
        .lte("requested_at", started)
      break
    }
  }

  await db
    .from("setlist_game_recalc_queue")
    .update({ in_flight: false })
    .eq("show_id", showId)
    .eq("in_flight", true)

  return json({ ok: true, runs }, 200)
})

async function clearQueue(db: SupabaseClient, showId: string): Promise<void> {
  await db.from("setlist_game_recalc_queue").delete().eq("show_id", showId)
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}
