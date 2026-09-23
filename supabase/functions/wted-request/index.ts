/**
 * Submit a WTED song request.
 * Signed-in: anon JWT in Authorization, Wysteria token in x-wysteria-authorization.
 * Guest: anon JWT in Authorization, optional guest JWT in x-wted-guest-authorization.
 * A guest with no valid token is issued one and it is returned as guestToken.
 *
 * Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WYSTERIA_JWT_SECRET
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { jwtVerify } from "https://deno.land/x/jose@v4.15.5/index.ts"
import { corsHeaders } from "../_shared/cors.ts"
import {
  WTED_MAX_REQUESTS_PER_IP_WINDOW,
  WTED_MAX_REQUESTS_PER_WINDOW,
  WTED_MIN_GAP_MS,
  WTED_REQUEST_WINDOW_MS,
  clientIp,
  guestSigningKey,
  hashClientIp,
  signGuestToken,
  verifyGuestToken,
} from "../_shared/wted-guest.ts"

function bearerToken(h: string | null): string | null {
  if (!h?.startsWith("Bearer ")) return null
  const t = h.slice(7).trim()
  return t !== "" ? t : null
}

const RADIO_CO_REQUEST_URL =
  "https://public.radio.co/stations/s3c11c85d6/requests"

const WTED_ERROR_MESSAGES: Record<number, string> = {
  403: "Requests for WTED Goose Radio have been disabled.",
  404: "Requested track not found. Submit a bug report for us to investigate.",
  409:
    "You have already requested this track. Stay tuned to WTED Goose Radio to hear it!",
  429:
    "WTED Radio has reached its request limit for this period. Please try again later.",
}

const LIMIT_MESSAGE =
  "You have reached the limit for requesting songs at this time, please check back later!"

function json(
  body: Record<string, unknown>,
  status: number,
  guestToken: string | null,
): Response {
  if (guestToken) body.guestToken = guestToken
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

async function profileIdFromToken(
  token: string,
  secret: Uint8Array,
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    const profileId = payload.profile_id
    if (typeof profileId !== "string" || profileId === "") return null
    return profileId
  } catch {
    return null
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, null)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const jwtSecret = Deno.env.get("WYSTERIA_JWT_SECRET")
  if (!supabaseUrl || !supabaseServiceKey || !jwtSecret) {
    return json({ error: "Server configuration error" }, 500, null)
  }

  const secretKey = new TextEncoder().encode(jwtSecret)
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  let body: { radio_id?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: "Invalid request body" }, 400, null)
  }

  const radioId = typeof body?.radio_id === "string" ? body.radio_id.trim() : ""
  if (!radioId) {
    return json({ error: "Missing or invalid radio_id" }, 400, null)
  }

  const trackIdNum = parseInt(radioId, 10)
  if (Number.isNaN(trackIdNum)) {
    return json({ error: "Invalid track ID" }, 400, null)
  }

  const { data: catalogRow, error: catalogError } = await supabase
    .from("wted_radio_ids")
    .select("radio_id")
    .eq("radio_id", radioId)
    .maybeSingle()

  if (catalogError || !catalogRow) {
    return json({ error: "This track is not available for request" }, 400, null)
  }

  const wysteriaHeader = bearerToken(req.headers.get("x-wysteria-authorization"))
  let profileId: string | null = null
  if (wysteriaHeader) {
    profileId = await profileIdFromToken(wysteriaHeader, secretKey)
    if (!profileId) return json({ error: "Unauthorized" }, 401, null)
  } else {
    const authorization = bearerToken(req.headers.get("authorization"))
    if (authorization) {
      profileId = await profileIdFromToken(authorization, secretKey)
    }
  }

  let guestToken: string | null = null
  let guestId: string | null = null
  if (!profileId) {
    const guestKey = await guestSigningKey(jwtSecret)
    const presented = bearerToken(req.headers.get("x-wted-guest-authorization"))
    if (presented) guestId = await verifyGuestToken(presented, guestKey)
    if (!guestId) guestId = crypto.randomUUID()
    guestToken = await signGuestToken(guestId, guestKey)
  }

  const ip = clientIp(req)
  const ipHash = ip ? await hashClientIp(ip, jwtSecret) : null
  const since = new Date(Date.now() - WTED_REQUEST_WINDOW_MS).toISOString()

  const identityColumn = profileId ? "user_id" : "guest_id"
  const identityValue = profileId ?? guestId
  if (!identityValue) return json({ error: "Unauthorized" }, 401, null)

  const { data: recentRequests, error: reqError } = await supabase
    .from("wted_requests")
    .select("radio_id, requested_at")
    .eq(identityColumn, identityValue)
    .gte("requested_at", since)
    .order("requested_at", { ascending: true })

  if (reqError) {
    return json({ error: "Failed to check request limit" }, 500, guestToken)
  }

  const requests = recentRequests ?? []

  if (requests.some((r) => String(r.radio_id) === radioId)) {
    return json(
      {
        error:
          "You have already requested this track. Stay tuned to WTED Goose Radio to hear it!",
      },
      409,
      guestToken,
    )
  }

  if (requests.length >= WTED_MAX_REQUESTS_PER_WINDOW) {
    const oldestTime = new Date(requests[0].requested_at).getTime()
    return json(
      {
        error: LIMIT_MESSAGE,
        nextAvailableAt: new Date(oldestTime + WTED_REQUEST_WINDOW_MS).toISOString(),
      },
      429,
      guestToken,
    )
  }

  const newest = requests[requests.length - 1]
  if (newest) {
    const elapsed = Date.now() - new Date(newest.requested_at).getTime()
    if (elapsed < WTED_MIN_GAP_MS) {
      return json(
        { error: "Please wait a few seconds before requesting another song." },
        429,
        guestToken,
      )
    }
  }

  if (ipHash) {
    const { data: ipRequests, error: ipError } = await supabase
      .from("wted_requests")
      .select("requested_at")
      .eq("ip_hash", ipHash)
      .gte("requested_at", since)
      .order("requested_at", { ascending: true })

    if (ipError) {
      return json({ error: "Failed to check request limit" }, 500, guestToken)
    }

    const ipRows = ipRequests ?? []
    if (ipRows.length >= WTED_MAX_REQUESTS_PER_IP_WINDOW) {
      const oldestTime = new Date(ipRows[0].requested_at).getTime()
      return json(
        {
          error: LIMIT_MESSAGE,
          nextAvailableAt: new Date(oldestTime + WTED_REQUEST_WINDOW_MS).toISOString(),
        },
        429,
        guestToken,
      )
    }
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
    if (!message) message = "Unable to submit request. Please try again later."

    return json({ error: message }, status, guestToken)
  }

  const { error: insertError } = await supabase.from("wted_requests").insert({
    user_id: profileId,
    guest_id: profileId ? null : guestId,
    ip_hash: ipHash,
    radio_id: radioId,
    requested_at: new Date().toISOString(),
  })

  if (insertError) {
    console.error("wted_requests insert failed:", insertError)
    return json(
      { error: "Request submitted but failed to save. Please try again later." },
      500,
      guestToken,
    )
  }

  return json({ success: true }, 200, guestToken)
})
