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

  let body: { setlist_combined_rows_expanded_by_default?: unknown }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400)
  }

  const expanded = body.setlist_combined_rows_expanded_by_default
  if (typeof expanded !== "boolean") {
    return jsonResponse(
      { error: "setlist_combined_rows_expanded_by_default must be a boolean" },
      400,
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data, error } = await supabase
    .from("profiles")
    .update({ setlist_combined_rows_expanded_by_default: expanded })
    .eq("id", profileId)
    .select("setlist_combined_rows_expanded_by_default")
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
    },
    200,
  )
})
