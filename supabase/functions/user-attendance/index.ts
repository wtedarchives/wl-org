/**
 * Add or remove user_attended_shows using Wysteria SSO JWT.
 * Client sends anon JWT in Authorization and Wysteria token in x-wysteria-authorization
 * (see lib/user-attendance-edge.ts). PostgREST + RLS use auth.uid(); this uses service role.
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

  /** Gateway accepts project JWT in `Authorization`; Wysteria SSO in `x-wysteria-authorization`. */
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

  let body: { action?: string; show_id?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400)
  }

  const action = typeof body.action === "string" ? body.action.trim() : ""
  const showId = typeof body.show_id === "string" ? body.show_id.trim() : ""

  if (action !== "add" && action !== "remove") {
    return jsonResponse({ error: "Invalid action" }, 400)
  }
  if (!showId || !UUID_RE.test(showId)) {
    return jsonResponse({ error: "Missing or invalid show_id" }, 400)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: showRow, error: showError } = await supabase
    .from("shows")
    .select("show_id")
    .eq("show_id", showId)
    .maybeSingle()

  if (showError) {
    return jsonResponse({ error: "Failed to validate show" }, 500)
  }
  if (!showRow) {
    return jsonResponse({ error: "Show not found" }, 404)
  }

  if (action === "add") {
    const { error: insertError } = await supabase.from("user_attended_shows").insert({
      user_id: profileId,
      show_id: showId,
    })

    if (insertError) {
      if (insertError.code === "23505") {
        return jsonResponse({ success: true, already_attended: true }, 200)
      }
      console.error("user-attendance insert error:", insertError)
      return jsonResponse({ error: "Failed to mark show as attended" }, 500)
    }

    return jsonResponse({ success: true }, 200)
  }

  const { error: deleteError } = await supabase
    .from("user_attended_shows")
    .delete()
    .eq("user_id", profileId)
    .eq("show_id", showId)

  if (deleteError) {
    console.error("user-attendance delete error:", deleteError)
    return jsonResponse({ error: "Failed to remove attended show" }, 500)
  }

  return jsonResponse({ success: true }, 200)
})
