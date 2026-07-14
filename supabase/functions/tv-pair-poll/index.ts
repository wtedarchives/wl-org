/**
 * Poll a TV pairing for completion.
 *
 * Anonymous (anon key). The TV sends its secret { device_code }. While the phone
 * hasn't signed in yet → { status: "pending" }. Once bound → { status: "ready",
 * token } exactly once, then the row is consumed (token cleared). Expired or
 * unknown → { status: "expired" }.
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

  let body: { device_code?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: "Invalid request body" }, 400)
  }
  const deviceCode = typeof body?.device_code === "string" ? body.device_code.trim() : ""
  if (!deviceCode) return json({ error: "Missing device_code" }, 400)

  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: row, error } = await supabase
    .from("tv_pairings")
    .select("id, status, token, expires_at")
    .eq("device_code", deviceCode)
    .maybeSingle()

  if (error) {
    console.error("tv-pair-poll select failed:", error)
    return json({ error: "Could not check status" }, 500)
  }
  // Unknown code → treat as expired so the TV restarts cleanly.
  if (!row) return json({ status: "expired" }, 200)

  const expired = new Date(row.expires_at).getTime() < Date.now()

  if (row.status === "bound" && row.token) {
    // Hand the token over exactly once, then consume the row.
    const { error: consumeErr } = await supabase
      .from("tv_pairings")
      .update({ status: "consumed", token: null })
      .eq("id", row.id)
      .eq("status", "bound")
    if (consumeErr) {
      console.error("tv-pair-poll consume failed:", consumeErr)
      return json({ error: "Could not check status" }, 500)
    }
    return json({ status: "ready", token: row.token }, 200)
  }

  if (row.status === "consumed") return json({ status: "expired" }, 200)
  if (expired) return json({ status: "expired" }, 200)

  return json({ status: "pending" }, 200)
})

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}
