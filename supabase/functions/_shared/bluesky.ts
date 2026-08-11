import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

const DEFAULT_PDS_URL = "https://bsky.social"
const POST_COLLECTION = "app.bsky.feed.post"

/** `app.bsky.feed.post.text` — maxGraphemes 300 (maxLength 3000 bytes). */
export const BLUESKY_MAX_GRAPHEMES = 300
/** `app.bsky.embed.images` blob maxSize. Oversized artwork is dropped, not fatal. */
const IMAGE_MAX_BYTES = 2_000_000
/** Refresh this far before `exp` so a slow request can't race expiry. */
const ACCESS_EXPIRY_SKEW_SECONDS = 60

export type BlueskyStrongRef = { uri: string; cid: string }

export type BlueskyBlob = {
  $type: "blob"
  ref: { $link: string }
  mimeType: string
  size: number
}

export type BlueskyFacet = {
  index: { byteStart: number; byteEnd: number }
  features: Array<{ $type: string; uri?: string; did?: string }>
}

export type BlueskyPostRecord = {
  $type: typeof POST_COLLECTION
  text: string
  createdAt: string
  langs?: string[]
  facets?: BlueskyFacet[]
  embed?: Record<string, unknown>
  reply?: { root: BlueskyStrongRef; parent: BlueskyStrongRef }
}

export type BlueskyCreatedPost = BlueskyStrongRef & { rkey: string }

type BlueskySessionState = {
  did: string
  pdsUrl: string
  accessJwt: string
  refreshJwt: string
}

/** Bluesky client bound to the cached session row. Created via {@link createBlueskyClient}. */
export type BlueskyClient = {
  did: string
  createPost(record: BlueskyPostRecord): Promise<BlueskyCreatedPost>
  putPost(rkey: string, record: BlueskyPostRecord): Promise<BlueskyStrongRef>
  uploadImage(imageUrl: string): Promise<BlueskyBlob | undefined>
}

const utf8Length = (value: string): number =>
  new TextEncoder().encode(value).byteLength

/** Graphemes, not code units — emoji and combining marks each count once. */
export function countGraphemes(value: string): number {
  const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" })
  let count = 0
  for (const _ of segmenter.segment(value)) count += 1
  return count
}

/** Truncate to `max` graphemes, appending `…` only when something was cut. */
export function fitGraphemes(value: string, max: number): string {
  if (max <= 0) return ""
  if (countGraphemes(value) <= max) return value
  const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" })
  const kept: string[] = []
  for (const { segment } of segmenter.segment(value)) {
    if (kept.length >= max - 1) break
    kept.push(segment)
  }
  return `${kept.join("").trimEnd()}…`
}

/**
 * Link facets for URLs that appear verbatim in `text`. Offsets are UTF-8 byte
 * positions, so they're computed from the encoded prefix rather than `indexOf`
 * directly — a non-ASCII song title ahead of the URL would otherwise shift them.
 */
export function buildLinkFacets(text: string, urls: string[]): BlueskyFacet[] {
  const facets: BlueskyFacet[] = []
  for (const url of urls) {
    const charIndex = text.indexOf(url)
    if (charIndex < 0) continue
    const byteStart = utf8Length(text.slice(0, charIndex))
    facets.push({
      index: { byteStart, byteEnd: byteStart + utf8Length(url) },
      features: [{ $type: "app.bsky.richtext.facet#link", uri: url }],
    })
  }
  return facets
}

/** `at://did:plc:…/app.bsky.feed.post/<rkey>` → `<rkey>`. */
export function rkeyFromPostUri(uri: string): string | null {
  const rkey = uri.trim().split("/").pop()?.trim()
  return rkey || null
}

/** Seconds-since-epoch `exp` from a JWT payload, or null when unreadable. */
function jwtExpirySeconds(token: string): number | null {
  const payload = token.split(".")[1]
  if (!payload) return null
  try {
    const padded = payload.replace(/-/g, "+").replace(/_/g, "/")
    const json = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="))
    const exp = (JSON.parse(json) as { exp?: unknown }).exp
    return typeof exp === "number" ? exp : null
  } catch {
    return null
  }
}

function accessJwtIsFresh(token: string): boolean {
  const exp = jwtExpirySeconds(token)
  if (exp === null) return false
  return exp - ACCESS_EXPIRY_SKEW_SECONDS > Math.floor(Date.now() / 1000)
}

async function readXrpcError(res: Response): Promise<string> {
  const text = await res.text().catch(() => "")
  if (!text) return `status ${res.status}`
  try {
    const body = JSON.parse(text) as { error?: string; message?: string }
    const parts = [body.error, body.message].filter(Boolean)
    return parts.length ? parts.join(": ") : `status ${res.status}`
  } catch {
    return `status ${res.status}: ${text.slice(0, 200)}`
  }
}

/** Is Bluesky posting switched on? Defaults to off when the row is missing. */
export async function isBlueskyEnabled(db: SupabaseClient): Promise<boolean> {
  const { data, error } = await db
    .from("bluesky_settings")
    .select("enabled")
    .maybeSingle()
  if (error) {
    console.error("bluesky_settings read:", error.message)
    return false
  }
  return data?.enabled === true
}

async function persistSession(
  db: SupabaseClient,
  session: BlueskySessionState,
): Promise<void> {
  const exp = jwtExpirySeconds(session.accessJwt)
  const { error } = await db.from("bluesky_session").upsert(
    {
      id: true,
      did: session.did,
      pds_url: session.pdsUrl,
      access_jwt: session.accessJwt,
      refresh_jwt: session.refreshJwt,
      expires_at: exp === null ? null : new Date(exp * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  )
  // Non-fatal: posting still works, we just re-login next invocation.
  if (error) console.error("bluesky_session upsert:", error.message)
}

/**
 * Log in with the app password. `createSession` is capped at 30 per 5 minutes
 * per account, so this is the fallback path — {@link loadSession} prefers the
 * cached tokens and only lands here on a cold or unusable session row.
 */
async function createSession(
  db: SupabaseClient,
  pdsUrl: string,
): Promise<BlueskySessionState> {
  const identifier = Deno.env.get("BLUESKY_IDENTIFIER")?.trim()
  const password = Deno.env.get("BLUESKY_APP_PASSWORD")?.trim()
  if (!identifier || !password) {
    throw new Error(
      "Missing BLUESKY_IDENTIFIER or BLUESKY_APP_PASSWORD server configuration.",
    )
  }

  const res = await fetch(`${pdsUrl}/xrpc/com.atproto.server.createSession`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ identifier, password }),
  })
  if (!res.ok) {
    throw new Error(`Bluesky createSession failed (${await readXrpcError(res)})`)
  }

  const body = (await res.json()) as {
    did?: string
    accessJwt?: string
    refreshJwt?: string
  }
  if (!body.did || !body.accessJwt || !body.refreshJwt) {
    throw new Error("Bluesky createSession returned an incomplete session.")
  }

  const session: BlueskySessionState = {
    did: body.did,
    pdsUrl,
    accessJwt: body.accessJwt,
    refreshJwt: body.refreshJwt,
  }
  await persistSession(db, session)
  return session
}

/** Trade the refresh token for a new access token. Returns null on failure. */
async function refreshSession(
  db: SupabaseClient,
  session: BlueskySessionState,
): Promise<BlueskySessionState | null> {
  const res = await fetch(
    `${session.pdsUrl}/xrpc/com.atproto.server.refreshSession`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.refreshJwt}`,
        Accept: "application/json",
      },
    },
  )
  if (!res.ok) {
    console.error("bluesky refreshSession:", await readXrpcError(res))
    return null
  }

  const body = (await res.json()) as {
    did?: string
    accessJwt?: string
    refreshJwt?: string
  }
  if (!body.accessJwt || !body.refreshJwt) return null

  const next: BlueskySessionState = {
    did: body.did ?? session.did,
    pdsUrl: session.pdsUrl,
    accessJwt: body.accessJwt,
    refreshJwt: body.refreshJwt,
  }
  await persistSession(db, next)
  return next
}

async function loadSession(db: SupabaseClient): Promise<BlueskySessionState> {
  const { data, error } = await db
    .from("bluesky_session")
    .select("did, pds_url, access_jwt, refresh_jwt")
    .maybeSingle()
  if (error) console.error("bluesky_session read:", error.message)

  const pdsUrl = (data?.pds_url as string | null)?.trim() || DEFAULT_PDS_URL
  const did = (data?.did as string | null)?.trim() ?? ""
  const accessJwt = (data?.access_jwt as string | null)?.trim() ?? ""
  const refreshJwt = (data?.refresh_jwt as string | null)?.trim() ?? ""

  if (did && accessJwt && accessJwt !== "" && accessJwtIsFresh(accessJwt)) {
    return { did, pdsUrl, accessJwt, refreshJwt }
  }
  if (did && refreshJwt) {
    const refreshed = await refreshSession(db, {
      did,
      pdsUrl,
      accessJwt,
      refreshJwt,
    })
    if (refreshed) return refreshed
  }
  return createSession(db, pdsUrl)
}

/**
 * Bluesky client over the cached session. Returns null when posting is
 * disabled via `bluesky_settings.enabled`, so callers can no-op quietly.
 */
export async function createBlueskyClient(
  db: SupabaseClient,
): Promise<BlueskyClient | null> {
  if (!(await isBlueskyEnabled(db))) return null

  let session = await loadSession(db)

  /** Authenticated XRPC call; re-authenticates once on an expired access token. */
  const authed = async (
    path: string,
    init: { body: BodyInit; contentType: string },
  ): Promise<Response> => {
    const send = () =>
      fetch(`${session.pdsUrl}/xrpc/${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessJwt}`,
          "Content-Type": init.contentType,
          Accept: "application/json",
        },
        body: init.body,
      })

    let res = await send()
    if (res.status !== 400 && res.status !== 401) return res

    // ExpiredToken surfaces as 400 on some deployments; try once more with a
    // fresh token before treating it as a real failure.
    const retryable = await res.clone().text().catch(() => "")
    if (!retryable.includes("ExpiredToken") && res.status !== 401) return res

    const refreshed =
      (await refreshSession(db, session)) ?? (await createSession(db, session.pdsUrl))
    session = refreshed
    res = await send()
    return res
  }

  const writeRecord = async (
    path: "com.atproto.repo.createRecord" | "com.atproto.repo.putRecord",
    payload: Record<string, unknown>,
  ): Promise<BlueskyStrongRef> => {
    const res = await authed(path, {
      body: JSON.stringify(payload),
      contentType: "application/json",
    })
    if (!res.ok) {
      throw new Error(`Bluesky ${path} failed (${await readXrpcError(res)})`)
    }
    const body = (await res.json()) as { uri?: string; cid?: string }
    if (!body.uri || !body.cid) {
      throw new Error(`Bluesky ${path} returned no record reference.`)
    }
    return { uri: body.uri, cid: body.cid }
  }

  return {
    get did() {
      return session.did
    },

    async createPost(record) {
      const ref = await writeRecord("com.atproto.repo.createRecord", {
        repo: session.did,
        collection: POST_COLLECTION,
        record,
      })
      const rkey = rkeyFromPostUri(ref.uri)
      if (!rkey) throw new Error(`Bluesky returned an unparseable URI: ${ref.uri}`)
      return { ...ref, rkey }
    },

    async putPost(rkey, record) {
      return await writeRecord("com.atproto.repo.putRecord", {
        repo: session.did,
        collection: POST_COLLECTION,
        rkey,
        record,
      })
    },

    /**
     * Fetch an image URL and upload it as a blob. Returns undefined — never
     * throws — when the image is missing, oversized, or not an image, so a bad
     * artwork URL degrades to a text-only post instead of losing the post.
     */
    async uploadImage(imageUrl) {
      const url = imageUrl.trim()
      if (!url) return undefined
      try {
        const imageRes = await fetch(url)
        if (!imageRes.ok) {
          console.error(`bluesky image fetch ${url}: status ${imageRes.status}`)
          return undefined
        }
        const mimeType = (imageRes.headers.get("content-type") ?? "")
          .split(";")[0]
          .trim()
        if (!mimeType.startsWith("image/")) {
          console.error(`bluesky image fetch ${url}: non-image ${mimeType}`)
          return undefined
        }
        const bytes = new Uint8Array(await imageRes.arrayBuffer())
        if (bytes.byteLength === 0) return undefined
        if (bytes.byteLength > IMAGE_MAX_BYTES) {
          console.error(
            `bluesky image ${url}: ${bytes.byteLength} bytes exceeds ${IMAGE_MAX_BYTES}`,
          )
          return undefined
        }

        const res = await authed("com.atproto.repo.uploadBlob", {
          body: bytes,
          contentType: mimeType,
        })
        if (!res.ok) {
          console.error("bluesky uploadBlob:", await readXrpcError(res))
          return undefined
        }
        const body = (await res.json()) as { blob?: BlueskyBlob }
        return body.blob ?? undefined
      } catch (err) {
        console.error(`bluesky image upload ${url}:`, err)
        return undefined
      }
    },
  }
}
