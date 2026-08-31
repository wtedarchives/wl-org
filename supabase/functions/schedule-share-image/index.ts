/**
 * Authorizing proxy in front of the Netlify schedule-card renderer.
 *
 * The renderer itself lives on Netlify (`netlify/functions/schedule-share-image.mts`)
 * because a 1080x1919 story frame is ~2.1M pixels, several times what Supabase
 * Edge's ~2s CPU cap allows. Nothing is rendered here; this function only
 * decides whether the caller is allowed to spend that CPU, then streams the
 * bytes back.
 *
 * Why the gate is here and not on Netlify: the caller is a signed-in browser, so
 * the credential is the site's own Wysteria session JWT, and verifying it needs
 * `WYSTERIA_JWT_SECRET` — which lives on Supabase and is stored hashed, so it
 * cannot be copied to Netlify. Running the check on the side that already holds
 * the secret means neither platform needs a new one: Netlify is reached with the
 * same `SHARE_IMAGE_SECRET` the setlist renderer already uses.
 *
 * Passing the image back through Deno costs a hop, not CPU — this is I/O, and a
 * ~300KB JPEG is nowhere near the worker's limits.
 *
 * Secrets: WYSTERIA_JWT_SECRET, SHARE_IMAGE_SECRET, SHARE_IMAGE_RENDERER_URL.
 * Set `verify_jwt = false` in config.toml: the Authorization header carries a
 * Wysteria token, not a Supabase Auth one, and is verified below.
 */
import { jwtVerify } from "https://deno.land/x/jose@v4.15.5/index.ts"

import { corsHeaders } from "../_shared/cors.ts"
import { maySeeScheduleShareImage } from "../_shared/schedule-share-card/access.ts"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Refuse to stream something implausible for a story JPEG. */
const MAX_IMAGE_BYTES = 12 * 1024 * 1024

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function bearerToken(header: string | null): string | null {
  if (!header?.startsWith("Bearer ")) return null
  const token = header.slice(7).trim()
  return token !== "" ? token : null
}

/**
 * Where the Netlify renderer lives.
 *
 * Derived from the setlist renderer's URL rather than configured separately, so
 * standing this up needed no new Supabase secret: the two functions sit on the
 * same host and differ only in the last path segment. `SCHEDULE_SHARE_IMAGE_RENDERER_URL`
 * overrides it if they ever diverge.
 */
function rendererUrl(): string | null {
  const explicit = Deno.env.get("SCHEDULE_SHARE_IMAGE_RENDERER_URL")?.trim()
  if (explicit) return explicit
  const setlist = Deno.env.get("SHARE_IMAGE_RENDERER_URL")?.trim()
  if (!setlist) return null
  try {
    const url = new URL(setlist)
    url.pathname = url.pathname.replace(
      /setlist-share-image\/?$/,
      "schedule-share-image",
    )
    return url.toString()
  } catch {
    return null
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }
  if (req.method !== "POST") {
    return jsonError("Method not allowed", 405)
  }

  const jwtSecret = Deno.env.get("WYSTERIA_JWT_SECRET")
  const shareSecret = Deno.env.get("SHARE_IMAGE_SECRET")
  const endpoint = rendererUrl()
  if (!jwtSecret || !shareSecret || !endpoint) {
    return jsonError("Server configuration error", 500)
  }

  const token =
    bearerToken(req.headers.get("x-wysteria-authorization")) ??
    bearerToken(req.headers.get("authorization"))
  if (!token) return jsonError("Unauthorized", 401)

  let payload: Record<string, unknown>
  try {
    const { payload: verified } = await jwtVerify(
      token,
      new TextEncoder().encode(jwtSecret),
    )
    payload = verified as Record<string, unknown>
  } catch {
    return jsonError("Unauthorized", 401)
  }

  const profileId = payload.profile_id
  if (typeof profileId !== "string" || !UUID_RE.test(profileId)) {
    return jsonError("Unauthorized", 401)
  }
  if (!maySeeScheduleShareImage(payload.is_admin === true, profileId)) {
    return jsonError("Forbidden", 403)
  }

  /*
   * The body is passed through untouched — the renderer does its own validation
   * of the view model, and duplicating those rules here would only let the two
   * drift. Only the query string is rebuilt, so a caller cannot reach into the
   * renderer's other parameters.
   */
  const body = await req.text()
  if (!body) return jsonError("Missing request body", 400)

  const reqUrl = new URL(req.url)
  const target = new URL(endpoint)
  const format = reqUrl.searchParams.get("format")
  if (format === "png") target.searchParams.set("format", "png")

  let upstream: Response
  try {
    upstream = await fetch(target.toString(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-share-image-secret": shareSecret,
      },
      body,
    })
  } catch (e) {
    console.error("schedule-share-image: renderer unreachable", e)
    return jsonError("Renderer unreachable", 502)
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "")
    console.error(
      `schedule-share-image: renderer returned ${upstream.status}`,
      detail.slice(0, 300),
    )
    return jsonError(
      `Renderer returned ${upstream.status}: ${detail.slice(0, 200)}`,
      502,
    )
  }

  const bytes = new Uint8Array(await upstream.arrayBuffer())
  if (bytes.byteLength === 0) return jsonError("Renderer returned an empty image", 502)
  if (bytes.byteLength > MAX_IMAGE_BYTES) return jsonError("Image too large", 502)

  return new Response(bytes, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type":
        upstream.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "no-store",
    },
  })
})
