import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"
import { getInstagramToken } from "../_shared/instagram.ts"

/**
 * Keeps the Instagram long-lived token alive.
 *
 * Tokens last 60 days. `getInstagramToken` refreshes when under two weeks
 * remain, so running this weekly leaves several chances to recover before a
 * lapse — which would otherwise surface as posting silently dying mid-tour.
 *
 * Cron-gated by INSTAGRAM_REFRESH_CRON_SECRET, matching the other scheduled
 * functions in this project.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  // Bearer in `authorization`, matching the other cron-driven functions here
  // (env secret on this side, Vault secret on the pg_cron side).
  const expected = Deno.env.get("INSTAGRAM_REFRESH_CRON_SECRET")?.trim()
  const supplied = (req.headers.get("authorization") ?? "")
    .replace(/^Bearer\s+/i, "")
    .trim()
  if (!expected || !supplied || supplied !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const db = createClient(supabaseUrl, serviceKey)
  const token = await getInstagramToken(db)

  const { data } = await db
    .from("instagram_auth")
    .select("expires_at")
    .maybeSingle()

  return new Response(
    JSON.stringify({
      ok: Boolean(token),
      expires_at: data?.expires_at ?? null,
    }),
    {
      status: token ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  )
})
