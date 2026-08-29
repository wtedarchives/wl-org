/**
 * Submit or update a signed-in user's show rating (Wysteria SSO JWT).
 * Client sends anon JWT in Authorization and Wysteria token in x-wysteria-authorization
 * (see lib/show-rating-edge.ts). PostgREST + RLS use auth.uid(); this uses service role.
 *
 * Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WYSTERIA_JWT_SECRET
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { jwtVerify } from "https://deno.land/x/jose@v4.15.5/index.ts"
import { corsHeaders } from "../_shared/cors.ts"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// Apostrophes: straight ', iOS long-press ` ‘ ’, plus common typographic variants.
const REVIEW_VALID_REGEX = /^[a-zA-Z0-9\s.,!?'"`´‘’‚‛ʼʻ′()<>—–-]*$/

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

function computeAverage(rows: { rating: number }[]): {
  average_rating: number
  review_count: number
} {
  if (rows.length === 0) {
    return { average_rating: 0, review_count: 0 }
  }
  const sum = rows.reduce((s, row) => s + row.rating, 0)
  return {
    average_rating: Math.round((sum / rows.length) * 100) / 100,
    review_count: rows.length,
  }
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

  let body: { show_id?: string; rating?: unknown; review?: unknown }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400)
  }

  const showId = typeof body.show_id === "string" ? body.show_id.trim() : ""
  if (!showId || !UUID_RE.test(showId)) {
    return jsonResponse({ error: "Missing or invalid show_id" }, 400)
  }

  const rawRating = body.rating
  if (typeof rawRating !== "number" || !Number.isFinite(rawRating)) {
    return jsonResponse({ error: "rating must be a number" }, 400)
  }
  const rating = Math.min(5, Math.max(1, Math.round(rawRating)))

  let review: string | null = null
  if (body.review != null) {
    if (typeof body.review !== "string") {
      return jsonResponse({ error: "review must be a string" }, 400)
    }
    const trimmed = body.review.trim()
    if (trimmed && !REVIEW_VALID_REGEX.test(trimmed)) {
      return jsonResponse(
        {
          error:
            "Review can only contain letters, numbers, and basic punctuation.",
        },
        400,
      )
    }
    review = trimmed || null
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

  const { data: existing, error: existingError } = await supabase
    .from("show_ratings")
    .select("uuid")
    .eq("show_id", showId)
    .eq("user_id", profileId)
    .maybeSingle()

  if (existingError) {
    console.error("show-rating lookup error:", existingError)
    return jsonResponse({ error: "Failed to save rating" }, 500)
  }

  if (existing?.uuid) {
    const { error: updateError } = await supabase
      .from("show_ratings")
      .update({ rating, review })
      .eq("show_id", showId)
      .eq("user_id", profileId)

    if (updateError) {
      console.error("show-rating update error:", updateError)
      return jsonResponse({ error: "Failed to save rating" }, 500)
    }
  } else {
    const { error: insertError } = await supabase.from("show_ratings").insert({
      show_id: showId,
      user_id: profileId,
      rating,
      review,
    })

    if (insertError) {
      console.error("show-rating insert error:", insertError)
      return jsonResponse({ error: "Failed to save rating" }, 500)
    }
  }

  const { data: allRows, error: allError } = await supabase
    .from("show_ratings")
    .select("rating")
    .eq("show_id", showId)

  if (allError) {
    console.error("show-rating aggregate error:", allError)
    return jsonResponse({ error: "Failed to load updated rating" }, 500)
  }

  const { average_rating, review_count } = computeAverage(
    (allRows ?? []) as { rating: number }[],
  )

  return jsonResponse(
    {
      success: true,
      average_rating,
      review_count,
      user_rating: rating,
      user_review: review,
    },
    200,
  )
})
