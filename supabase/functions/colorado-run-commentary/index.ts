/**
 * Colorado run voice commentary.
 * GET  — the caller's clip, with a short-lived signed URL.
 * POST — one audio file per account, stored privately.
 *
 * Authorization is the Wysteria session JWT. Gateway verify_jwt is off.
 * Writes use the service role.
 *
 * Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WYSTERIA_JWT_SECRET
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { jwtVerify } from "https://deno.land/x/jose@v4.15.5/index.ts"
import { corsHeaders as sharedCorsHeaders } from "../_shared/cors.ts"

const corsHeaders = {
  ...sharedCorsHeaders,
  "Access-Control-Allow-Headers":
    `${sharedCorsHeaders["Access-Control-Allow-Headers"]}, x-duration-seconds`,
}

const BUCKET = "colorado-run-commentary"
const MAX_BYTES = 5 * 1024 * 1024
const MAX_SECONDS = 60
const SIGNED_URL_SECONDS = 60 * 60

const MIME_EXT: Record<string, string> = {
  "audio/webm": "webm",
  "video/webm": "webm",
  "audio/mp4": "mp4",
  "audio/mpeg": "mp3",
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function baseMime(value: string | null) {
  return (value ?? "").split(";")[0].trim().toLowerCase()
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }
  if (req.method !== "GET" && req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405)
  }

  const authHeader = req.headers.get("authorization")
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
  if (!token) return json({ error: "Unauthorized" }, 401)

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const jwtSecret = Deno.env.get("WYSTERIA_JWT_SECRET")
  if (!supabaseUrl || !supabaseServiceKey || !jwtSecret) {
    return json({ error: "Server configuration error" }, 500)
  }

  let profileId: string | undefined
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret))
    profileId = typeof payload.profile_id === "string" ? payload.profile_id : undefined
  } catch {
    return json({ error: "Unauthorized" }, 401)
  }
  if (!profileId || !/^[0-9a-f-]{36}$/i.test(profileId)) {
    return json({ error: "Unauthorized" }, 401)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: existing, error: existingError } = await supabase
    .from("colorado_run_commentaries")
    .select("storage_path, duration_seconds, content_type")
    .eq("user_id", profileId)
    .maybeSingle()

  if (existingError) return json({ error: "Could not load commentary" }, 500)

  if (req.method === "GET") {
    if (!existing) return json({ submitted: false })
    const { data: signed, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(existing.storage_path, SIGNED_URL_SECONDS)
    if (signError || !signed?.signedUrl) {
      return json({ error: "Could not load commentary" }, 500)
    }
    return json({
      submitted: true,
      playbackUrl: signed.signedUrl,
      durationSeconds: existing.duration_seconds,
    })
  }

  if (existing) {
    return json({ error: "You have already submitted a commentary." }, 409)
  }

  const contentType = baseMime(req.headers.get("content-type"))
  const ext = MIME_EXT[contentType]
  if (!ext) return json({ error: "Use a WebM or MP4 recording." }, 415)

  const duration = Number(req.headers.get("x-duration-seconds"))
  if (!Number.isFinite(duration) || duration <= 0 || duration > MAX_SECONDS) {
    return json({ error: "Keep the commentary to 60 seconds or less." }, 400)
  }

  const bytes = new Uint8Array(await req.arrayBuffer())
  if (bytes.byteLength === 0) return json({ error: "Empty recording" }, 400)
  if (bytes.byteLength > MAX_BYTES) return json({ error: "Recording is too large." }, 413)

  const storagePath = `${profileId}/${Date.now()}.${ext}`
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(
    storagePath,
    bytes,
    { contentType, upsert: false },
  )
  if (uploadError) return json({ error: "Could not save commentary" }, 500)

  const { error: insertError } = await supabase.from("colorado_run_commentaries").insert({
    user_id: profileId,
    storage_path: storagePath,
    duration_seconds: Math.round(duration * 10) / 10,
    content_type: contentType,
  })

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([storagePath])
    if (insertError.code === "23505") {
      return json({ error: "You have already submitted a commentary." }, 409)
    }
    return json({ error: "Could not save commentary" }, 500)
  }

  return json({ submitted: true })
})
