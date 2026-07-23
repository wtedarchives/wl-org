import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { jwtVerify } from "https://deno.land/x/jose@v4.15.5/index.ts"
import { corsHeaders } from "../_shared/cors.ts"

const BUCKET = "show-posters"
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])

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

function sanitizeFilename(raw: string | null): string | null {
  if (!raw?.trim()) return null
  const base = raw.trim().split(/[/\\]/).pop() ?? ""
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120)
  return safe || null
}

function extensionForContentType(contentType: string): string {
  switch (contentType) {
    case "image/jpeg":
      return "jpg"
    case "image/png":
      return "png"
    case "image/webp":
      return "webp"
    case "image/gif":
      return "gif"
    default:
      return "bin"
  }
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
    return httpErr("Invalid or expired Wysteria session", 401)
  }

  if (jwtPayload.is_admin !== true) return httpErr("Forbidden", 403)

  const contentTypeRaw = (req.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase()
  const contentType = contentTypeRaw === "image/jpg" ? "image/jpeg" : contentTypeRaw
  if (!ALLOWED_TYPES.has(contentType)) {
    return httpErr("Unsupported image type", 400)
  }

  const reqUrl = new URL(req.url)
  const filenameParam = sanitizeFilename(reqUrl.searchParams.get("filename"))
  const ext = extensionForContentType(contentType)
  const filename = filenameParam?.includes(".")
    ? filenameParam
    : `${filenameParam ?? "poster"}.${ext}`

  const bytes = new Uint8Array(await req.arrayBuffer())
  if (bytes.byteLength === 0) return httpErr("Empty body", 400)
  if (bytes.byteLength > 20 * 1024 * 1024) {
    return httpErr("Image too large", 413)
  }

  const storagePath = `${crypto.randomUUID()}/${filename}`
  const db = createClient(supabaseUrl, supabaseServiceKey)
  const { error: uploadError } = await db.storage.from(BUCKET).upload(
    storagePath,
    bytes,
    {
      contentType,
      upsert: false,
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
