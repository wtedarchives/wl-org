/**
 * Register / unregister a native-app APNs device token for live setlist alerts.
 *
 * Anonymous (anon key in Authorization, like other public functions). Per-device:
 * no sign-in required, so `profile_id` is left null.
 *
 * POST body:
 *   { device_token: string, environment?: "production" | "sandbox", unregister?: boolean }
 *
 * Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !serviceKey) return json({ error: "Server configuration error" }, 500)

  let body: {
    device_token?: string
    environment?: string
    unregister?: boolean
    live_shows?: boolean
    setlist_game?: boolean
    radio_program?: boolean
  }
  try {
    body = await req.json()
  } catch {
    return json({ error: "Invalid JSON body" }, 400)
  }

  const deviceToken = body.device_token?.trim()
  if (!deviceToken) return json({ error: "Missing device_token" }, 400)

  const environment = body.environment === "sandbox" ? "sandbox" : "production"
  const supabase = createClient(supabaseUrl, serviceKey)

  if (body.unregister) {
    const { error } = await supabase
      .from("apns_tokens")
      .delete()
      .eq("device_token", deviceToken)
    if (error) {
      console.error("apns-register unregister failed:", error)
      return json({ error: "Could not unregister device" }, 500)
    }
    return json({ ok: true, unregistered: true }, 200)
  }

  // Per-type opt-in. Default live-shows on (backward compatible); game and radio
  // program off when a caller omits a flag.
  const liveShows = body.live_shows ?? true
  const setlistGame = body.setlist_game ?? false
  const radioProgram = body.radio_program ?? false

  const { error } = await supabase
    .from("apns_tokens")
    .upsert(
      {
        device_token: deviceToken,
        environment,
        live_shows_enabled: liveShows,
        setlist_game_enabled: setlistGame,
        radio_program_enabled: radioProgram,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "device_token" },
    )
  if (error) {
    console.error("apns-register upsert failed:", error)
    return json({ error: "Could not register device" }, 500)
  }
  return json({ ok: true, registered: true }, 200)
})

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}
