import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { jwtVerify } from "https://deno.land/x/jose@v4.15.5/index.ts"
import { corsHeaders } from "../_shared/cors.ts"

const BUCKET = "setlist-images"

/** Set to `false` before ship — when `true`, any valid JWT can upload (testing). */
const TEMP_DISABLE_SETLIST_SHARE_UPLOAD_ADMIN_GATE = false

function httpErr(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function bearerToken(h: string | null): string | null {
  if (!h?.startsWith("Bearer ")) return null
  const t = h.slice(7).trim()
  return t !== "" ? t : null
}

/** `{show_id}/{show_id}.png` or `{show_id}/{show_id}_cn.png` */
function sanitizeSetlistStoragePath(raw: string | null): string | null {
  if (!raw?.trim()) return null
  const path = raw.trim().replace(/^\/+/, "")
  if (!path || path.includes("..") || path.includes("\\")) return null
  if (!/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+(_cn)?\.png$/i.test(path)) return null
  return path
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return httpErr("Method not allowed", 405)

  const token =
    bearerToken(req.headers.get("x-wysteria-authorization")) ??
    bearerToken(req.headers.get("authorization"))
  if (!token) return httpErr("Unauthorized", 401)

  const jwtSecret = Deno.env.get("WYSTERIA_JWT_SECRET")
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!jwtSecret || !supabaseUrl || !supabaseServiceKey) {
    return httpErr("Server configuration error", 500)
  }

  let jwtPayload: Record<string, unknown>
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret))
    jwtPayload = payload as Record<string, unknown>
  } catch {
    return httpErr("Unauthorized", 401)
  }

  if (
    !TEMP_DISABLE_SETLIST_SHARE_UPLOAD_ADMIN_GATE &&
    jwtPayload.is_admin !== true
  ) {
    return httpErr("Forbidden", 403)
  }

  const reqUrl = new URL(req.url)
  const storagePath = sanitizeSetlistStoragePath(reqUrl.searchParams.get("path"))
  if (!storagePath) return httpErr("Invalid or missing path query parameter", 400)

  const bytes = new Uint8Array(await req.arrayBuffer())
  if (bytes.byteLength === 0) return httpErr("Empty body", 400)
  if (bytes.byteLength > 20 * 1024 * 1024) {
    return httpErr("Image too large", 413)
  }

  const db = createClient(supabaseUrl, supabaseServiceKey)
  const { error: uploadError } = await db.storage.from(BUCKET).upload(
    storagePath,
    bytes,
    {
      contentType: "image/png",
      upsert: true,
    },
  )

  if (uploadError) {
    console.error(uploadError)
    return httpErr(uploadError.message, 500)
  }

  const { data: publicData } = db.storage.from(BUCKET).getPublicUrl(storagePath)

  return new Response(
    JSON.stringify({
      data: {
        path: storagePath,
        publicUrl: publicData.publicUrl,
      },
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  )
})
