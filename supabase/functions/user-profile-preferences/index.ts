/**
 * Update signed-in user profile preferences (Wysteria SSO JWT).
 * Client sends anon JWT in Authorization and Wysteria token in x-wysteria-authorization
 * (see lib/user-profile-preferences-edge.ts). PostgREST + RLS use auth.uid(); this uses service role.
 *
 * Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WYSTERIA_JWT_SECRET
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { jwtVerify } from "https://deno.land/x/jose@v4.15.5/index.ts"
import { corsHeaders } from "../_shared/cors.ts"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function bearerToken(h: string | null): string | null {
  if (!h?.startsWith("Bearer ")) return null
  const t = h.slice(7).trim()
  return t !== "" ? t : null
}

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

type PushSubscriptionInput = {
  endpoint?: unknown
  p256dh?: unknown
  auth?: unknown
}

function parsePushSubscription(
  raw: unknown,
): { endpoint: string; p256dh: string; auth: string } | null {
  if (!raw || typeof raw !== "object") return null
  const row = raw as PushSubscriptionInput
  if (
    typeof row.endpoint !== "string" ||
    typeof row.p256dh !== "string" ||
    typeof row.auth !== "string"
  ) {
    return null
  }
  const endpoint = row.endpoint.trim()
  const p256dh = row.p256dh.trim()
  const auth = row.auth.trim()
  if (!endpoint || !p256dh || !auth) return null
  return { endpoint, p256dh, auth }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405)
  }

  const token =
    bearerToken(req.headers.get("x-wysteria-authorization")) ??
    bearerToken(req.headers.get("authorization"))
  if (!token) {
    return jsonResponse({ error: "Unauthorized" }, 401)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const jwtSecret = Deno.env.get("WYSTERIA_JWT_SECRET")
  if (!supabaseUrl || !supabaseServiceKey || !jwtSecret) {
    return jsonResponse({ error: "Server configuration error" }, 500)
  }

  let payload: Record<string, unknown>
  try {
    const { payload: verified } = await jwtVerify(
      token,
      new TextEncoder().encode(jwtSecret),
    )
    payload = verified as Record<string, unknown>
  } catch {
    return jsonResponse({ error: "Unauthorized" }, 401)
  }

  const profileId = payload.profile_id as string | undefined
  if (!profileId || !UUID_RE.test(profileId)) {
    return jsonResponse({ error: "Unauthorized" }, 401)
  }

  let body: {
    setlist_combined_rows_expanded_by_default?: unknown
    push_notifications_enabled?: unknown
    push_subscription?: unknown
  }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400)
  }

  const hasSetlistPref = "setlist_combined_rows_expanded_by_default" in body
  const hasPushPref = "push_notifications_enabled" in body

  if (!hasSetlistPref && !hasPushPref) {
    return jsonResponse({ error: "No preference fields provided" }, 400)
  }

  const profilePatch: Record<string, unknown> = {}

  if (hasSetlistPref) {
    const expanded = body.setlist_combined_rows_expanded_by_default
    if (typeof expanded !== "boolean") {
      return jsonResponse(
        { error: "setlist_combined_rows_expanded_by_default must be a boolean" },
        400,
      )
    }
    profilePatch.setlist_combined_rows_expanded_by_default = expanded
  }

  if (hasPushPref) {
    const pushEnabled = body.push_notifications_enabled
    if (typeof pushEnabled !== "boolean") {
      return jsonResponse(
        { error: "push_notifications_enabled must be a boolean" },
        400,
      )
    }
    profilePatch.push_notifications_enabled = pushEnabled
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  if (hasPushPref && body.push_notifications_enabled === true) {
    const subscription = parsePushSubscription(body.push_subscription)
    if (!subscription) {
      return jsonResponse(
        { error: "push_subscription is required when enabling push notifications" },
        400,
      )
    }

    const userAgent = req.headers.get("user-agent")
    const { error: upsertError } = await supabase.from("push_subscriptions").upsert(
      {
        profile_id: profileId,
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
        user_agent: userAgent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    )

    if (upsertError) {
      console.error("push_subscriptions upsert error:", upsertError)
      return jsonResponse({ error: "Failed to save push subscription" }, 500)
    }
  }

  if (hasPushPref && body.push_notifications_enabled === false) {
    const { error: deleteError } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("profile_id", profileId)
    if (deleteError) {
      console.error("push_subscriptions delete error:", deleteError)
      return jsonResponse({ error: "Failed to remove push subscription" }, 500)
    }
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(profilePatch)
    .eq("id", profileId)
    .select("setlist_combined_rows_expanded_by_default, push_notifications_enabled")
    .maybeSingle()

  if (error) {
    console.error("user-profile-preferences update error:", error)
    return jsonResponse({ error: "Failed to save preferences" }, 500)
  }
  if (!data) {
    return jsonResponse({ error: "Profile not found" }, 404)
  }

  return jsonResponse(
    {
      success: true,
      setlist_combined_rows_expanded_by_default:
        data.setlist_combined_rows_expanded_by_default === true,
      push_notifications_enabled: data.push_notifications_enabled === true,
    },
    200,
  )
})
