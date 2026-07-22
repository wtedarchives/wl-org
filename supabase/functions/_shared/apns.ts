// APNs (Apple Push Notification service) transport for the native app.
//
// Token-based auth: a short-lived ES256 JWT signed with the APNs .p8 key.
// Secrets (Edge Function env):
//   APNS_KEY_ID       – 10-char key ID for the .p8
//   APNS_TEAM_ID      – 10-char Apple Team ID
//   APNS_PRIVATE_KEY  – contents of the AuthKey_XXXX.p8 (PKCS#8 PEM)
//   APNS_BUNDLE_ID    – (optional) app bundle id; defaults to org.wysterialane.wtedradio

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

const DEFAULT_BUNDLE_ID = "org.wysterialane.wtedradio"
// APNs allows a provider JWT to live up to 60 min; refresh a little early.
const JWT_TTL_SECONDS = 50 * 60

const PROD_HOST = "https://api.push.apple.com"
const SANDBOX_HOST = "https://api.sandbox.push.apple.com"

export type ApnsPayload = {
  title: string
  body: string
  showID?: string
  /** WTED episode uuid — tap opens the episode page (multi-show radio program). */
  episodeUUID?: string
  url?: string
  /** Routing hint for the app's tap handler (e.g. "setlistGame" → open the game). */
  type?: string
  /** Set `aps.mutable-content` so the app's Notification Service Extension runs
   * (e.g. to attach an image). Harmless for apps without the extension. */
  mutableContent?: boolean
}

function base64UrlFromString(value: string): string {
  return base64UrlFromBytes(new TextEncoder().encode(value))
}

function base64UrlFromBytes(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function pemToDer(pem: string): Uint8Array {
  const base64 = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "")
  const binary = atob(base64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i)
  return out
}

let cachedKey: CryptoKey | null = null
let cachedJwt: { token: string; expiresAt: number } | null = null

async function importSigningKey(privateKeyPem: string): Promise<CryptoKey> {
  if (cachedKey) return cachedKey
  cachedKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(privateKeyPem),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  )
  return cachedKey
}

export type ApnsConfig = {
  jwt: string
  bundleId: string
}

export async function getApnsConfig(): Promise<
  { ok: true; config: ApnsConfig } | { ok: false; error: string }
> {
  const keyId = Deno.env.get("APNS_KEY_ID")?.trim()
  const teamId = Deno.env.get("APNS_TEAM_ID")?.trim()
  const privateKey = Deno.env.get("APNS_PRIVATE_KEY")?.trim()
  const bundleId = (Deno.env.get("APNS_BUNDLE_ID")?.trim() || DEFAULT_BUNDLE_ID)
  if (!keyId || !teamId || !privateKey) {
    return { ok: false, error: "Missing APNS_KEY_ID, APNS_TEAM_ID, or APNS_PRIVATE_KEY." }
  }

  // `iat` must be within the JWT's validity window; seconds are integer.
  const nowSeconds = Math.floor(nowMs() / 1000)
  if (cachedJwt && cachedJwt.expiresAt - 60 > nowSeconds) {
    return { ok: true, config: { jwt: cachedJwt.token, bundleId } }
  }

  try {
    const key = await importSigningKey(privateKey)
    const header = base64UrlFromString(JSON.stringify({ alg: "ES256", kid: keyId }))
    const claims = base64UrlFromString(JSON.stringify({ iss: teamId, iat: nowSeconds }))
    const signingInput = `${header}.${claims}`
    const signature = new Uint8Array(
      await crypto.subtle.sign(
        { name: "ECDSA", hash: "SHA-256" },
        key,
        new TextEncoder().encode(signingInput),
      ),
    )
    const jwt = `${signingInput}.${base64UrlFromBytes(signature)}`
    cachedJwt = { token: jwt, expiresAt: nowSeconds + JWT_TTL_SECONDS }
    return { ok: true, config: { jwt, bundleId } }
  } catch (err) {
    console.error("APNs JWT init failed:", err)
    return { ok: false, error: err instanceof Error ? err.message : "APNs JWT init failed." }
  }
}

/** `Date.now()` is available in Edge Functions; wrapped for a single call site. */
function nowMs(): number {
  return Date.now()
}

export type ApnsSendResult = {
  status: number
  /** APNs `reason` string on failure (e.g. "BadDeviceToken", "Unregistered"). */
  reason?: string
}

/** A token APNs says is dead — delete it from our table. */
export function isDeadTokenReason(status: number, reason?: string): boolean {
  if (status === 410) return true // Unregistered
  if (status === 400 && reason === "BadDeviceToken") return true
  if (status === 400 && reason === "DeviceTokenNotForTopic") return true
  return false
}

export async function sendApns(
  deviceToken: string,
  environment: string | null | undefined,
  config: ApnsConfig,
  payload: ApnsPayload,
): Promise<ApnsSendResult> {
  const host = environment === "sandbox" ? SANDBOX_HOST : PROD_HOST
  const apsFields: Record<string, unknown> = {
    alert: { title: payload.title, body: payload.body },
    sound: "default",
  }
  if (payload.mutableContent) apsFields["mutable-content"] = 1
  const aps: Record<string, unknown> = { aps: apsFields }
  if (payload.showID) aps.showID = payload.showID
  if (payload.episodeUUID) aps.episodeUUID = payload.episodeUUID
  if (payload.url) aps.url = payload.url
  if (payload.type) aps.type = payload.type

  const res = await fetch(`${host}/3/device/${deviceToken}`, {
    method: "POST",
    headers: {
      authorization: `bearer ${config.jwt}`,
      "apns-topic": config.bundleId,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
    },
    body: JSON.stringify(aps),
  })
  if (res.status === 200) {
    // Drain body to free the connection.
    await res.text().catch(() => undefined)
    return { status: 200 }
  }
  let reason: string | undefined
  try {
    const parsed = JSON.parse(await res.text()) as { reason?: string }
    reason = parsed.reason
  } catch {
    reason = undefined
  }
  return { status: res.status, reason }
}

export type ApnsTokenRow = {
  device_token: string
  environment: string | null
}

export type ApnsBatchResult = {
  attempted: number
  sent: number
  failed: number
  removed: number
  skipped?: string
  lastError?: string
}

/**
 * Send one payload to a batch of device tokens. Handles the JWT config, the send
 * loop, and dead-token cleanup. Never throws.
 */
export async function sendApnsBatch(
  db: SupabaseClient,
  rows: ApnsTokenRow[],
  payload: ApnsPayload,
): Promise<ApnsBatchResult> {
  const apns = await getApnsConfig()
  if (!apns.ok) {
    console.warn("APNs batch skipped:", apns.error)
    return { attempted: 0, sent: 0, failed: 0, removed: 0, skipped: apns.error }
  }
  if (rows.length === 0) {
    return { attempted: 0, sent: 0, failed: 0, removed: 0, skipped: "no registered devices" }
  }

  let sent = 0
  let failed = 0
  let removed = 0
  let lastError: string | undefined

  for (const row of rows) {
    try {
      const result = await sendApns(row.device_token, row.environment, apns.config, payload)
      if (result.status === 200) {
        sent += 1
        continue
      }
      failed += 1
      lastError = `APNs ${result.status}${result.reason ? ` (${result.reason})` : ""}`
      if (isDeadTokenReason(result.status, result.reason)) {
        const { error: deleteError } = await db
          .from("apns_tokens")
          .delete()
          .eq("device_token", row.device_token)
        if (!deleteError) removed += 1
      }
    } catch (err: unknown) {
      failed += 1
      lastError = err instanceof Error ? err.message : String(err)
      console.warn("APNs send failed:", row.device_token, err)
    }
  }

  return { attempted: rows.length, sent, failed, removed, lastError }
}
