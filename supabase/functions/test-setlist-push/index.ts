/**
 * TEMPORARY test-only function: sends a Setlist Game "picks lock soon" push
 * (type: "setlistGame" + mutable-content, so the app's Notification Service
 * Extension attaches the Archives logo) to every APNs device opted into Setlist
 * Game reminders. Bypasses the show-window + dedup gates of the real function so
 * it can be fired on demand. DELETE after verifying the logo renders on device.
 *
 * Deploy with --no-verify-jwt; call with an empty POST (no auth needed).
 * Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, APNS_* (see _shared/apns.ts)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"
import { type ApnsTokenRow, sendApnsBatch } from "../_shared/apns.ts"

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "config" }), { status: 500 })
  }
  const db = createClient(supabaseUrl, serviceKey)

  const { data, error } = await db
    .from("apns_tokens")
    .select("device_token, environment")
    .eq("setlist_game_enabled", true)
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  const tokens = (data ?? []) as ApnsTokenRow[]
  const result = await sendApnsBatch(db, tokens, {
    title: "Setlist Game Picks Lock Soon",
    body: "TEST · Goose · New York, NY · Madison Square Garden",
    type: "setlistGame",
    mutableContent: true,
  })

  return new Response(
    JSON.stringify({ registeredDevices: tokens.length, result }),
    { headers: { "content-type": "application/json" } },
  )
})
