/**
 * Register a Live Activity push token from the native app.
 *
 * Anonymous (anon key in Authorization, like apns-register). Two kinds:
 *   { kind: "start",  token, environment }             → device push-to-start token
 *   { kind: "update", token, show_id, environment }    → per-activity token for a show
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

  let body: { kind?: string; token?: string; show_id?: string; environment?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: "Invalid JSON body" }, 400)
  }

  const kind = body.kind
  const token = body.token?.trim()
  const environment = body.environment === "production" ? "production" : "sandbox"
  if (!token) return json({ error: "Missing token" }, 400)

  const supabase = createClient(supabaseUrl, serviceKey)
  const now = new Date().toISOString()

  if (kind === "start") {
    const { error } = await supabase
      .from("live_activity_start_tokens")
      .upsert({ token, environment, updated_at: now }, { onConflict: "token" })
    if (error) {
      console.error("live-activity-register start upsert failed:", error)
      return json({ error: "Could not register token" }, 500)
    }
    return json({ ok: true, registered: true }, 200)
  }

  if (kind === "update") {
    const showId = body.show_id?.trim()
    if (!showId) return json({ error: "Missing show_id" }, 400)
    const { error } = await supabase
      .from("live_activity_update_tokens")
      .upsert({ token, show_id: showId, environment, updated_at: now }, { onConflict: "token" })
    if (error) {
      console.error("live-activity-register update upsert failed:", error)
      return json({ error: "Could not register token" }, 500)
    }
    return json({ ok: true, registered: true }, 200)
  }

  return json({ error: "Unknown kind" }, 400)
})

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}
