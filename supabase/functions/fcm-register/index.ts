/**
 * Register / unregister a native Android FCM token for push notifications.
 *
 * The Android parallel to apns-register. Anonymous (anon key in Authorization,
 * like other public functions). Per-device: no sign-in required, so `profile_id`
 * is left null.
 *
 * POST body:
 *   { fcm_token: string, unregister?: boolean, live_shows?: boolean, setlist_game?: boolean }
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
    fcm_token?: string
    unregister?: boolean
    live_shows?: boolean
    setlist_game?: boolean
  }
  try {
    body = await req.json()
  } catch {
    return json({ error: "Invalid JSON body" }, 400)
  }

  const fcmToken = body.fcm_token?.trim()
  if (!fcmToken) return json({ error: "Missing fcm_token" }, 400)

  const supabase = createClient(supabaseUrl, serviceKey)

  if (body.unregister) {
    const { error } = await supabase
      .from("fcm_tokens")
      .delete()
      .eq("fcm_token", fcmToken)
    if (error) {
      console.error("fcm-register unregister failed:", error)
      return json({ error: "Could not unregister device" }, 500)
    }
    return json({ ok: true, unregistered: true }, 200)
  }

  // Per-type opt-in. Default live-shows on (backward compatible) and game off
  // when a caller omits a flag.
  const liveShows = body.live_shows ?? true
  const setlistGame = body.setlist_game ?? false

  const { error } = await supabase
    .from("fcm_tokens")
    .upsert(
      {
        fcm_token: fcmToken,
        live_shows_enabled: liveShows,
        setlist_game_enabled: setlistGame,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "fcm_token" },
    )
  if (error) {
    console.error("fcm-register upsert failed:", error)
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
