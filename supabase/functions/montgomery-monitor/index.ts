import { corsHeaders } from "../_shared/cors.ts"

/**
 * Hourly server-side monitor for montgomeryinc.net (Goose "S!GNAL" ARG).
 * Fingerprints the public surface + linked assets, compares to the last-seen
 * fingerprint in public.montgomery_monitor_state, and on a genuine change posts
 * one alert to Discourse chat (goosec / channel 14) as wted-brains. Storing the
 * fingerprint in the DB means each change is announced exactly once (no hourly
 * re-post). Triggered by pg_cron via pg_net; gated by x-monitor-secret.
 */

const COMMUNITY_ORIGIN = "https://community.wysterialane.org"
const DISCOURSE_CHANNEL_ID = 14
const MONITOR_ID = "montgomeryinc.net"
const BASE = "https://montgomeryinc.net"
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

const CORE_PATHS = ["/", "/employee", "/privacy", "/robots.txt", "/identity.svg"]
const PROBE_PATHS = [
  "/careers", "/about", "/goosemas", "/signal", "/montnet", "/shop", "/tickets", "/api/",
]
const MAX_MESSAGE_LENGTH = 3900

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buffer)
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function extractAssetRefs(html: string): string[] {
  const refs = new Set<string>()
  const re = /(?:src|href)="(\/(?:scripts|styles)\/[^"]+)"/g
  let match: RegExpExecArray | null
  while ((match = re.exec(html)) !== null) refs.add(match[1])
  return [...refs].sort()
}

/** Fetch the whole surface and produce a deterministic fingerprint string. */
async function buildFingerprint(): Promise<string> {
  const bodies: Record<string, string> = {}
  const hashLines: string[] = []

  for (const path of CORE_PATHS) {
    const url = BASE + path
    const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" })
    // "/" must be reachable and 200; otherwise treat the run as inconclusive.
    if (path === "/" && res.status !== 200) {
      throw new Error(`root returned ${res.status}`)
    }
    const buffer = await res.arrayBuffer()
    bodies[path] = new TextDecoder().decode(buffer)
    hashLines.push(`${await sha256Hex(buffer)}  ${url}`)
  }

  const assetRefs = new Set<string>()
  for (const path of ["/", "/employee"]) {
    for (const ref of extractAssetRefs(bodies[path] ?? "")) assetRefs.add(ref)
  }
  const sortedRefs = [...assetRefs].sort()

  for (const ref of sortedRefs) {
    const url = BASE + ref
    const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" })
    const buffer = await res.arrayBuffer()
    hashLines.push(`${await sha256Hex(buffer)}  ${url}`)
  }

  const probeLines: string[] = []
  for (const path of PROBE_PATHS) {
    const res = await fetch(BASE + path, { headers: { "User-Agent": UA }, redirect: "manual" })
    probeLines.push(`probe ${res.status} ${path}`)
  }

  const refLines = sortedRefs.map((ref) => `ref ${ref}`)
  return [...hashLines.sort(), ...refLines, ...probeLines].join("\n")
}

/** Human-readable added/removed line summary between two fingerprints. */
function diffSummary(previous: string, next: string): string {
  const prevSet = new Set(previous.split("\n"))
  const nextSet = new Set(next.split("\n"))
  const added = [...nextSet].filter((l) => !prevSet.has(l))
  const removed = [...prevSet].filter((l) => !nextSet.has(l))
  const clean = (line: string) => {
    const m = line.match(/^[0-9a-f]{64}  (.+)$/)
    return m ? m[1] : line
  }
  const parts: string[] = []
  if (added.length) {
    parts.push("NEW/CHANGED:\n" + added.slice(0, 15).map((l) => "+ " + clean(l)).join("\n"))
  }
  if (removed.length) {
    parts.push("GONE/OLD:\n" + removed.slice(0, 15).map((l) => "- " + clean(l)).join("\n"))
  }
  return parts.join("\n") || "(fingerprint changed)"
}

async function postDiscourse(
  channelId: number,
  message: string,
): Promise<{ ok: boolean; status?: number; detail?: unknown; error?: string }> {
  const apiKey =
    Deno.env.get("BRAINS_API_KEY")?.trim() || Deno.env.get("DISCOURSE_API_KEY")?.trim()
  const apiUsername =
    Deno.env.get("BRAINS_USERNAME")?.trim() || Deno.env.get("DISCOURSE_API_USERNAME")?.trim()
  if (!apiKey || !apiUsername) {
    return { ok: false, error: "Missing BRAINS_API_KEY / BRAINS_USERNAME" }
  }
  const res = await fetch(`${COMMUNITY_ORIGIN}/chat/${channelId}.json`, {
    method: "POST",
    headers: {
      "Api-Key": apiKey,
      "Api-Username": apiUsername,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ message }),
  })
  const text = await res.text()
  let detail: unknown = null
  if (text) {
    try {
      detail = JSON.parse(text)
    } catch {
      detail = { raw: text.slice(0, 300) }
    }
  }
  return res.ok
    ? { ok: true, status: res.status, detail }
    : { ok: false, status: res.status, error: `Discourse returned ${res.status}`, detail }
}

// --- state table access via PostgREST (service role) ---
const REST_URL = `${Deno.env.get("SUPABASE_URL")}/rest/v1/montgomery_monitor_state`
function restHeaders(): Record<string, string> {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" }
}

async function readState(): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${REST_URL}?id=eq.${MONITOR_ID}&select=*`, { headers: restHeaders() })
  const rows = (await res.json()) as Record<string, unknown>[]
  return rows[0] ?? null
}

async function patchState(patch: Record<string, unknown>): Promise<void> {
  await fetch(`${REST_URL}?id=eq.${MONITOR_ID}`, {
    method: "PATCH",
    headers: { ...restHeaders(), Prefer: "return=minimal" },
    body: JSON.stringify(patch),
  })
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders })
    }
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405)
    }

    const expected = Deno.env.get("MONTGOMERY_MONITOR_SECRET")?.trim()
    const provided = req.headers.get("x-monitor-secret")?.trim()
    if (!expected || provided !== expected || provided === "") {
      return jsonResponse({ error: "Unauthorized" }, 401)
    }

    const now = new Date().toISOString()
    const prior = await readState()
    const previous = (prior?.fingerprint as string | null) ?? null
    const priorFailures = (prior?.consecutive_failures as number | null) ?? 0

    // Compute the current fingerprint; any fetch/network failure is inconclusive.
    let fingerprint: string
    try {
      fingerprint = await buildFingerprint()
    } catch (e) {
      const messageText = e instanceof Error ? e.message : String(e)
      await patchState({
        last_checked_at: now,
        last_status: `error: ${messageText.slice(0, 200)}`,
        consecutive_failures: priorFailures + 1,
        updated_at: now,
      })
      return jsonResponse({ ok: false, status: "fetch_error", error: messageText }, 200)
    }

    // First run: seed the baseline silently, never post.
    if (previous === null) {
      await patchState({
        fingerprint,
        last_checked_at: now,
        last_status: "baseline_seeded",
        consecutive_failures: 0,
        updated_at: now,
      })
      return jsonResponse({ ok: true, status: "baseline_seeded" }, 200)
    }

    // Unchanged.
    if (previous === fingerprint) {
      await patchState({
        last_checked_at: now,
        last_status: "no_change",
        consecutive_failures: 0,
        updated_at: now,
      })
      return jsonResponse({ ok: true, status: "no_change" }, 200)
    }

    // Changed: post once, and only advance the stored fingerprint if the post
    // succeeded (so a Discourse outage retries next hour instead of losing it).
    const summary = diffSummary(previous, fingerprint)
    const message = `🛰️ montgomeryinc.net changed (${now})\n${summary}\nCheck: https://montgomeryinc.net/employee`.slice(
      0,
      MAX_MESSAGE_LENGTH,
    )
    const post = await postDiscourse(DISCOURSE_CHANNEL_ID, message)

    if (post.ok) {
      await patchState({
        fingerprint,
        last_checked_at: now,
        last_changed_at: now,
        last_status: "change_posted",
        consecutive_failures: 0,
        updated_at: now,
      })
    } else {
      await patchState({
        last_checked_at: now,
        last_status: `change_post_failed: ${post.error ?? "unknown"}`,
        consecutive_failures: priorFailures + 1,
        updated_at: now,
      })
    }

    return jsonResponse(
      { ok: true, status: "change_detected", posted: post.ok, post, summary },
      200,
    )
  } catch (e) {
    const messageText = e instanceof Error ? e.message : String(e)
    return jsonResponse({ error: "Unhandled function error", message: messageText }, 500)
  }
})
