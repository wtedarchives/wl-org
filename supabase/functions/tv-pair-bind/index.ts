/**
 * Bind a signed-in Wysteria session to a pending TV pairing.
 *
 * Called by the phone (web /tv-login page or the iOS app) AFTER the user is
 * authenticated. The caller's Wysteria JWT rides in `x-wysteria-authorization`
 * (verified here with WYSTERIA_JWT_SECRET, same as wted-request). We attach that
 * token to the pairing row identified by { user_code }; the TV then receives it
 * on its next poll.
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  // The user's Wysteria JWT (not the anon key).
  const token =
    bearerToken(req.headers.get("x-wysteria-authorization")) ??
    bearerToken(req.headers.get("authorization"))
  if (!token) return json({ error: "Unauthorized" }, 401)

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const jwtSecret = Deno.env.get("WYSTERIA_JWT_SECRET")
  if (!supabaseUrl || !serviceKey || !jwtSecret) {
    return json({ error: "Server configuration error" }, 500)
  }

  let profileId: string | undefined
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret))
    profileId = (payload as Record<string, unknown>).profile_id as string | undefined
  } catch {
    return json({ error: "Unauthorized" }, 401)
  }
  if (!profileId) return json({ error: "Unauthorized" }, 401)

  let body: { user_code?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: "Invalid request body" }, 400)
  }
  const userCode = typeof body?.user_code === "string" ? body.user_code.trim().toUpperCase() : ""
  if (!userCode) return json({ error: "Missing user_code" }, 400)

  const supabase = createClient(supabaseUrl, serviceKey)

  // Only a still-pending, unexpired pairing may be bound.
  const { data: row, error: selErr } = await supabase
    .from("tv_pairings")
    .select("id, status, expires_at")
    .eq("user_code", userCode)
    .maybeSingle()

  if (selErr) {
    console.error("tv-pair-bind select failed:", selErr)
    return json({ error: "Could not complete sign-in" }, 500)
  }
  if (!row) return json({ error: "That code wasn't found. Check the code on your TV." }, 404)
  if (row.status !== "pending") return json({ error: "This code was already used." }, 409)
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return json({ error: "This code expired. Start again on your TV." }, 410)
  }

  const { error: updErr } = await supabase
    .from("tv_pairings")
    .update({ status: "bound", token, profile_id: profileId })
    .eq("id", row.id)
    .eq("status", "pending") // guard against a concurrent bind

  if (updErr) {
    console.error("tv-pair-bind update failed:", updErr)
    return json({ error: "Could not complete sign-in" }, 500)
  }

  return json({ success: true }, 200)
})

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}
