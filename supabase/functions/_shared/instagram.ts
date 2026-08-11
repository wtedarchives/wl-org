import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

const GRAPH_ORIGIN = "https://graph.instagram.com"
const GRAPH_VERSION = "v23.0"
const GRAPH = `${GRAPH_ORIGIN}/${GRAPH_VERSION}`

/** Instagram caption limit. */
export const INSTAGRAM_MAX_CAPTION_CHARS = 2200

/** Refresh once the long-lived token has less than this left of its 60 days. */
const REFRESH_WHEN_REMAINING_MS = 14 * 24 * 60 * 60 * 1000

/** Container processing poll — images finish fast, but not always instantly. */
const STATUS_POLL_ATTEMPTS = 10
const STATUS_POLL_DELAY_MS = 1500

export type InstagramPublishResult = {
  mediaId: string
  containerId: string
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function readGraphError(res: Response): Promise<string> {
  const text = await res.text().catch(() => "")
  if (!text) return `status ${res.status}`
  try {
    const body = JSON.parse(text) as {
      error?: { message?: string; code?: number; error_user_msg?: string }
    }
    const err = body.error
    const detail = err?.error_user_msg || err?.message
    return detail ? `${detail}${err?.code ? ` (code ${err.code})` : ""}`
    : `status ${res.status}`
  } catch {
    return `status ${res.status}: ${text.slice(0, 200)}`
  }
}

/** Is Instagram posting switched on? Defaults to off when the row is missing. */
export async function isInstagramEnabled(db: SupabaseClient): Promise<boolean> {
  const { data, error } = await db
    .from("instagram_settings")
    .select("enabled")
    .maybeSingle()
  if (error) {
    console.error("instagram_settings read:", error.message)
    return false
  }
  return data?.enabled === true
}

type AuthRow = { access_token: string; expires_at: string | null }

/**
 * Long-lived token, refreshed when it's close to expiring.
 *
 * The token lives in `instagram_auth` rather than in a Supabase secret because
 * refreshing *replaces* it, and an edge function can't write its own secrets.
 * The `INSTAGRAM_ACCESS_TOKEN` secret is only the seed for the first run.
 */
export async function getInstagramToken(
  db: SupabaseClient,
): Promise<string | null> {
  const { data, error } = await db
    .from("instagram_auth")
    .select("access_token, expires_at")
    .maybeSingle()
  if (error) console.error("instagram_auth read:", error.message)

  const row = data as AuthRow | null
  let token = row?.access_token?.trim() ?? ""
  let expiresAt = row?.expires_at ? Date.parse(row.expires_at) : NaN

  if (!token) {
    // Cold start — seed from the secret. Expiry is unknown until first refresh,
    // so assume the near term and let the refresh below correct it.
    const seed = Deno.env.get("INSTAGRAM_ACCESS_TOKEN")?.trim()
    if (!seed) {
      console.error("Missing INSTAGRAM_ACCESS_TOKEN server configuration.")
      return null
    }
    token = seed
    expiresAt = NaN
    await persistInstagramToken(db, token, null)
  }

  const needsRefresh =
    Number.isNaN(expiresAt) || expiresAt - Date.now() < REFRESH_WHEN_REMAINING_MS
  if (!needsRefresh) return token

  const refreshed = await refreshInstagramToken(db, token)
  return refreshed ?? token
}

async function persistInstagramToken(
  db: SupabaseClient,
  accessToken: string,
  expiresAt: string | null,
): Promise<void> {
  const { error } = await db.from("instagram_auth").upsert(
    {
      id: true,
      access_token: accessToken,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  )
  if (error) console.error("instagram_auth upsert:", error.message)
}

/**
 * Exchange a long-lived token for a fresh 60-day one. Returns null on failure —
 * the caller keeps using the current token, which may still have life in it.
 *
 * Instagram requires the token be at least 24 hours old before it can be
 * refreshed, so a just-generated token will fail here; that's expected and
 * harmless because it has ~60 days remaining anyway.
 */
export async function refreshInstagramToken(
  db: SupabaseClient,
  currentToken: string,
): Promise<string | null> {
  const url = new URL(`${GRAPH_ORIGIN}/refresh_access_token`)
  url.searchParams.set("grant_type", "ig_refresh_token")
  url.searchParams.set("access_token", currentToken)

  const res = await fetch(url, { headers: { Accept: "application/json" } })
  if (!res.ok) {
    console.error("instagram refresh_access_token:", await readGraphError(res))
    return null
  }

  const body = (await res.json()) as {
    access_token?: string
    expires_in?: number
  }
  if (!body.access_token) return null

  const expiresAt =
    typeof body.expires_in === "number" ?
      new Date(Date.now() + body.expires_in * 1000).toISOString()
    : null
  await persistInstagramToken(db, body.access_token, expiresAt)
  return body.access_token
}

/** Container states from `GET /{container-id}?fields=status_code`. */
type ContainerStatus =
  | "EXPIRED"
  | "ERROR"
  | "FINISHED"
  | "IN_PROGRESS"
  | "PUBLISHED"

async function readContainerStatus(
  containerId: string,
  token: string,
): Promise<ContainerStatus | null> {
  const url = new URL(`${GRAPH}/${containerId}`)
  url.searchParams.set("fields", "status_code")
  url.searchParams.set("access_token", token)
  const res = await fetch(url, { headers: { Accept: "application/json" } })
  if (!res.ok) {
    console.error("instagram container status:", await readGraphError(res))
    return null
  }
  const body = (await res.json()) as { status_code?: ContainerStatus }
  return body.status_code ?? null
}

/**
 * Publish a single image.
 *
 * Instagram has no binary upload for images — `image_url` must be reachable by
 * Meta's servers at publish time, so the caller has to host the JPEG publicly
 * first. Two steps: create a container, then publish it once processing lands.
 */
export async function publishInstagramImage(options: {
  igUserId: string
  token: string
  imageUrl: string
  caption: string
  altText?: string
}): Promise<InstagramPublishResult> {
  const { igUserId, token, imageUrl, caption, altText } = options

  const createBody = new URLSearchParams({
    image_url: imageUrl,
    caption: caption.slice(0, INSTAGRAM_MAX_CAPTION_CHARS),
    access_token: token,
  })
  if (altText?.trim()) createBody.set("alt_text", altText.trim())

  const createRes = await fetch(`${GRAPH}/${igUserId}/media`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: createBody,
  })
  if (!createRes.ok) {
    throw new Error(
      `Instagram container create failed (${await readGraphError(createRes)})`,
    )
  }
  const created = (await createRes.json()) as { id?: string }
  const containerId = created.id?.trim()
  if (!containerId) {
    throw new Error("Instagram container create returned no id.")
  }

  // Wait for Meta to fetch and process image_url before publishing.
  for (let attempt = 0; attempt < STATUS_POLL_ATTEMPTS; attempt += 1) {
    const status = await readContainerStatus(containerId, token)
    if (status === "FINISHED" || status === "PUBLISHED") break
    if (status === "ERROR" || status === "EXPIRED") {
      throw new Error(`Instagram container ${containerId} status ${status}`)
    }
    if (attempt === STATUS_POLL_ATTEMPTS - 1) {
      throw new Error(
        `Instagram container ${containerId} still ${status ?? "unknown"} after ` +
          `${STATUS_POLL_ATTEMPTS} checks`,
      )
    }
    await sleep(STATUS_POLL_DELAY_MS)
  }

  const publishRes = await fetch(`${GRAPH}/${igUserId}/media_publish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({ creation_id: containerId, access_token: token }),
  })
  if (!publishRes.ok) {
    throw new Error(
      `Instagram publish failed (${await readGraphError(publishRes)})`,
    )
  }
  const published = (await publishRes.json()) as { id?: string }
  if (!published.id) throw new Error("Instagram publish returned no media id.")

  return { mediaId: published.id, containerId }
}
