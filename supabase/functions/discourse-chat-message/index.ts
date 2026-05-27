import { corsHeaders } from "../_shared/cors.ts"

const COMMUNITY_ORIGIN = "https://community.wysterialane.org"

/** GOOSE(c) — https://community.wysterialane.org/chat/c/goosec/14 */
const DEFAULT_ALLOWED_CHANNEL_IDS = [14]

const MAX_MESSAGE_LENGTH = 4000

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function parseAllowedChannelIds(): Set<number> {
  const raw = Deno.env.get("DISCOURSE_CHAT_ALLOWED_CHANNEL_IDS")?.trim()
  const ids = raw ?
    raw.split(",").map((s) => parseInt(s.trim(), 10))
  : DEFAULT_ALLOWED_CHANNEL_IDS
  return new Set(ids.filter((n) => Number.isFinite(n) && n > 0))
}

function invokeSecretMatches(req: Request): boolean {
  const expected = Deno.env.get("DISCOURSE_CHAT_INVOKE_SECRET")?.trim()
  if (!expected) return false
  const provided =
    req.headers.get("x-wysteria-discourse-chat-secret")?.trim() ??
    req.headers.get("x-discourse-chat-secret")?.trim()
  return provided === expected && provided !== ""
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders })
    }

    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405)
    }

    if (!invokeSecretMatches(req)) {
      return jsonResponse({ error: "Unauthorized" }, 401)
    }

    const apiKey = Deno.env.get("DISCOURSE_API_KEY")?.trim()
    const apiUsername = Deno.env.get("DISCOURSE_API_USERNAME")?.trim()
    if (!apiKey || !apiUsername) {
      return jsonResponse(
        {
          error: "Server configuration error",
          hint:
            "supabase secrets set DISCOURSE_API_KEY=... DISCOURSE_API_USERNAME=wted-brains DISCOURSE_CHAT_INVOKE_SECRET=... && supabase functions deploy discourse-chat-message",
        },
        500,
      )
    }

    let body: { channel_id?: number; message?: string }
    try {
      body = (await req.json()) as { channel_id?: number; message?: string }
    } catch {
      return jsonResponse({ error: "Invalid request body" }, 400)
    }

    const channelId =
      typeof body.channel_id === "number" && Number.isFinite(body.channel_id) ?
        Math.trunc(body.channel_id)
      : DEFAULT_ALLOWED_CHANNEL_IDS[0]

    const allowed = parseAllowedChannelIds()
    if (!allowed.has(channelId)) {
      return jsonResponse({ error: "Channel not allowed" }, 403)
    }

    const message = typeof body.message === "string" ? body.message.trim() : ""
    if (!message) {
      return jsonResponse({ error: "Missing or empty message" }, 400)
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return jsonResponse(
        { error: `Message exceeds ${MAX_MESSAGE_LENGTH} characters` },
        400,
      )
    }

    const discourseRes = await fetch(
      `${COMMUNITY_ORIGIN}/chat/${channelId}.json`,
      {
        method: "POST",
        headers: {
          "Api-Key": apiKey,
          "Api-Username": apiUsername,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ message }),
      },
    )

    const text = await discourseRes.text()
    let discourseBody: unknown = null
    if (text) {
      try {
        discourseBody = JSON.parse(text)
      } catch {
        discourseBody = { raw: text.slice(0, 500) }
      }
    }

    if (!discourseRes.ok) {
      return jsonResponse(
        {
          error: `Discourse returned ${discourseRes.status}`,
          channel_id: channelId,
          detail: discourseBody,
        },
        502,
      )
    }

    return jsonResponse(
      {
        ok: true,
        channel_id: channelId,
        discourse: discourseBody,
      },
      200,
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return jsonResponse({ error: "Unhandled function error", message }, 500)
  }
})
