/**
 * Submit a WTED song request for the signed-in user.
 * Client sends anon JWT in Authorization and Wysteria token in x-wysteria-authorization
 * (see lib/wted-request-edge.ts).
 *
 * Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WYSTERIA_JWT_SECRET
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { jwtVerify } from "https://deno.land/x/jose@v4.15.5/index.ts"
import { corsHeaders } from "../_shared/cors.ts"

function bearerToken(h: string | null): string | null {
  if (!h?.startsWith("Bearer ")) return null
  const t = h.slice(7).trim()
  return t !== "" ? t : null
}

const RADIO_CO_REQUEST_URL =
  "https://public.radio.co/stations/s3c11c85d6/requests"
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const MAX_REQUESTS_PER_WINDOW = 4

const WTED_ERROR_MESSAGES: Record<number, string> = {
  403: "Requests for WTED Goose Radio have been disabled.",
  404: "Requested track not found. Submit a bug report for us to investigate.",
  409:
    "You have already requested this track. Stay tuned to WTED Goose Radio to hear it!",
  429:
    "WTED Radio has reached its request limit for this period. Please try again later.",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  /** Gateway accepts project JWT in `Authorization`; Wysteria SSO in `x-wysteria-authorization`. */
  const token =
    bearerToken(req.headers.get("x-wysteria-authorization")) ??
    bearerToken(req.headers.get("authorization"))
  if (!token) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const jwtSecret = Deno.env.get("WYSTERIA_JWT_SECRET")
  if (!supabaseUrl || !supabaseServiceKey || !jwtSecret) {
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  let payload: Record<string, unknown>
  try {
    const { payload: verified } = await jwtVerify(token, new TextEncoder().encode(jwtSecret))
    payload = verified as Record<string, unknown>
  } catch {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const profileId = payload.profile_id as string | undefined
  if (!profileId) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  let body: { radio_id?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const radioId = typeof body?.radio_id === "string" ? body.radio_id.trim() : ""
  if (!radioId) {
    return new Response(
      JSON.stringify({ error: "Missing or invalid radio_id" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const { data: catalogRow, error: catalogError } = await supabase
    .from("wted_radio_ids")
    .select("radio_id")
    .eq("radio_id", radioId)
    .maybeSingle()

  if (catalogError || !catalogRow) {
    return new Response(
      JSON.stringify({ error: "This track is not available for request" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const trackIdNum = parseInt(String(radioId), 10)
  if (Number.isNaN(trackIdNum)) {
    return new Response(
      JSON.stringify({ error: "Invalid track ID" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()

  const { data: recentRequests, error: reqError } = await supabase
    .from("wted_requests")
    .select("radio_id, requested_at")
    .eq("user_id", profileId)
    .gte("requested_at", since)
    .order("requested_at", { ascending: true })

  if (reqError) {
    return new Response(
      JSON.stringify({ error: "Failed to check request limit" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const requests = recentRequests ?? []

  if (requests.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = requests[0]
    const oldestTime = new Date(oldest.requested_at).getTime()
    const nextAvailable = new Date(oldestTime + RATE_LIMIT_WINDOW_MS)
    return new Response(
      JSON.stringify({
        error:
          "You have reached the limit for requesting songs at this time, please check back later!",
        nextAvailableAt: nextAvailable.toISOString(),
      }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const alreadyRequested = requests.some((r) => String(r.radio_id) === radioId)
  if (alreadyRequested) {
    return new Response(
      JSON.stringify({
        error:
          "You have already requested this track. Stay tuned to WTED Goose Radio to hear it!",
      }),
      { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const radioResponse = await fetch(RADIO_CO_REQUEST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ track_id: trackIdNum }),
  })

  if (!radioResponse.ok) {
    const status = radioResponse.status
    let message = WTED_ERROR_MESSAGES[status]

    if (!message) {
      try {
        const data = await radioResponse.json()
        const apiMessage = data?.errors?.[0]?.message
        if (apiMessage) message = apiMessage
      } catch {
        // ignore
      }
    }
    if (!message) {
      message = "Unable to submit request. Please try again later."
    }

    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const { error: insertError } = await supabase.from("wted_requests").insert({
    user_id: profileId,
    radio_id: radioId,
    requested_at: new Date().toISOString(),
  })

  if (insertError) {
    return new Response(
      JSON.stringify({
        error:
          "Request submitted but failed to save. Please try again later.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  )
})
