/**
 * Begin an Apple TV sign-in pairing.
 *
 * Anonymous (anon key in Authorization, like other public functions). Mints a
 * secret device_code (polled by the TV) and a short user_code (embedded in the
 * QR URL), stores a pending row, and returns the QR target + poll cadence.
 *
 * Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Env: TV_LOGIN_BASE_URL (site origin for the /tv-login page; defaults to prod)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

const PAIRING_TTL_SECONDS = 600 // 10 minutes
const POLL_INTERVAL_SECONDS = 5
const DEFAULT_BASE_URL = "https://wted-org.netlify.app"

/** Unambiguous alphabet for the human-facing code (no 0/O/1/I). */
const USER_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

function hex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")
}

function randomUserCode(length = 8): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let out = ""
  for (const b of bytes) out += USER_CODE_ALPHABET[b % USER_CODE_ALPHABET.length]
  return out
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !serviceKey) return json({ error: "Server configuration error" }, 500)

  const baseUrl = (Deno.env.get("TV_LOGIN_BASE_URL") ?? DEFAULT_BASE_URL).replace(/\/$/, "")
  const supabase = createClient(supabaseUrl, serviceKey)

  const deviceCode = hex(crypto.getRandomValues(new Uint8Array(32)))
  const expiresAt = new Date(Date.now() + PAIRING_TTL_SECONDS * 1000).toISOString()

  // Retry a couple of times in the (unlikely) event of a user_code collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const userCode = randomUserCode()
    const { error } = await supabase.from("tv_pairings").insert({
      device_code: deviceCode,
      user_code: userCode,
      status: "pending",
      expires_at: expiresAt,
    })
    if (!error) {
      return json({
        device_code: deviceCode,
        user_code: userCode,
        verification_url: `${baseUrl}/tv-login?code=${userCode}`,
        interval: POLL_INTERVAL_SECONDS,
        expires_in: PAIRING_TTL_SECONDS,
      }, 200)
    }
    // 23505 = unique_violation → retry with a new user_code.
    if ((error as { code?: string }).code !== "23505") {
      console.error("tv-pair-start insert failed:", error)
      return json({ error: "Could not start pairing" }, 500)
    }
  }
  return json({ error: "Could not start pairing" }, 500)
})

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}
