// FCM (Firebase Cloud Messaging) HTTP v1 transport for the Android app.
//
// The Android analog of apns.ts. Sends are DATA-ONLY (the client builds every
// notification), and auth is an OAuth2 access token minted from a Google
// service-account key (RS256 JWT → token exchange).
//
// Secrets (Edge Function env):
//   FCM_PROJECT_ID       – Firebase project id (e.g. "wted-android")
//   FCM_SERVICE_ACCOUNT  – the full service-account JSON (client_email + private_key)

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

const TOKEN_URI = "https://oauth2.googleapis.com/token"
const SCOPE = "https://www.googleapis.com/auth/firebase.messaging"
// Google access tokens live ~60 min; refresh a little early.
const TOKEN_TTL_SECONDS = 55 * 60

/** Data-message payload. All values are strings (FCM `data` requires strings). */
export type FcmData = Record<string, string>

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

type ServiceAccount = { client_email: string; private_key: string }

let cachedKey: CryptoKey | null = null
let cachedToken: { token: string; expiresAt: number } | null = null

async function importSigningKey(privateKeyPem: string): Promise<CryptoKey> {
  if (cachedKey) return cachedKey
  cachedKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(privateKeyPem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  )
  return cachedKey
}

export type FcmConfig = {
  accessToken: string
  projectId: string
}

export async function getFcmConfig(): Promise<
  { ok: true; config: FcmConfig } | { ok: false; error: string }
> {
  const projectId = Deno.env.get("FCM_PROJECT_ID")?.trim()
  const serviceAccountRaw = Deno.env.get("FCM_SERVICE_ACCOUNT")?.trim()
  if (!projectId || !serviceAccountRaw) {
    return { ok: false, error: "Missing FCM_PROJECT_ID or FCM_SERVICE_ACCOUNT." }
  }

  let account: ServiceAccount
  try {
    account = JSON.parse(serviceAccountRaw) as ServiceAccount
  } catch {
    return { ok: false, error: "FCM_SERVICE_ACCOUNT is not valid JSON." }
  }
  if (!account.client_email || !account.private_key) {
    return { ok: false, error: "FCM_SERVICE_ACCOUNT missing client_email or private_key." }
  }

  const nowSeconds = Math.floor(Date.now() / 1000)
  if (cachedToken && cachedToken.expiresAt - 60 > nowSeconds) {
    return { ok: true, config: { accessToken: cachedToken.token, projectId } }
  }

  try {
    const key = await importSigningKey(account.private_key)
    const header = base64UrlFromString(JSON.stringify({ alg: "RS256", typ: "JWT" }))
    const claims = base64UrlFromString(JSON.stringify({
      iss: account.client_email,
      scope: SCOPE,
      aud: TOKEN_URI,
      iat: nowSeconds,
      exp: nowSeconds + TOKEN_TTL_SECONDS,
    }))
    const signingInput = `${header}.${claims}`
    const signature = new Uint8Array(
      await crypto.subtle.sign(
        { name: "RSASSA-PKCS1-v1_5" },
        key,
        new TextEncoder().encode(signingInput),
      ),
    )
    const assertion = `${signingInput}.${base64UrlFromBytes(signature)}`

    const res = await fetch(TOKEN_URI, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    })
    const parsed = JSON.parse(await res.text()) as { access_token?: string; error?: string }
    if (!res.ok || !parsed.access_token) {
      return { ok: false, error: `FCM token exchange failed: ${parsed.error ?? res.status}` }
    }
    cachedToken = { token: parsed.access_token, expiresAt: nowSeconds + TOKEN_TTL_SECONDS }
    return { ok: true, config: { accessToken: parsed.access_token, projectId } }
  } catch (err) {
    console.error("FCM token init failed:", err)
    return { ok: false, error: err instanceof Error ? err.message : "FCM token init failed." }
  }
}

export type FcmSendResult = {
  status: number
  /** FCM error status string on failure (e.g. "UNREGISTERED", "INVALID_ARGUMENT"). */
  reason?: string
}

/** A token FCM says is dead — delete it from our table. */
export function isDeadFcmReason(status: number, reason?: string): boolean {
  if (status === 404) return true // UNREGISTERED
  if (status === 400 && reason === "INVALID_ARGUMENT") return true
  if (reason === "UNREGISTERED") return true
  return false
}

export async function sendFcm(
  config: FcmConfig,
  token: string,
  data: FcmData,
): Promise<FcmSendResult> {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${config.projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        message: { token, data, android: { priority: "HIGH" } },
      }),
    },
  )
  if (res.status === 200) {
    await res.text().catch(() => undefined)
    return { status: 200 }
  }
  let reason: string | undefined
  try {
    const parsed = JSON.parse(await res.text()) as { error?: { status?: string } }
    reason = parsed.error?.status
  } catch {
    reason = undefined
  }
  return { status: res.status, reason }
}

export type FcmTokenRow = { fcm_token: string }

export type FcmBatchResult = {
  attempted: number
  sent: number
  failed: number
  removed: number
  skipped?: string
  lastError?: string
}

/**
 * Send one data payload to a batch of FCM tokens. Handles the OAuth config, the
 * send loop, and dead-token cleanup. Never throws.
 */
export async function sendFcmBatch(
  db: SupabaseClient,
  rows: FcmTokenRow[],
  data: FcmData,
): Promise<FcmBatchResult> {
  const fcm = await getFcmConfig()
  if (!fcm.ok) {
    console.warn("FCM batch skipped:", fcm.error)
    return { attempted: 0, sent: 0, failed: 0, removed: 0, skipped: fcm.error }
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
      const result = await sendFcm(fcm.config, row.fcm_token, data)
      if (result.status === 200) {
        sent += 1
        continue
      }
      failed += 1
      lastError = `FCM ${result.status}${result.reason ? ` (${result.reason})` : ""}`
      if (isDeadFcmReason(result.status, result.reason)) {
        const { error: deleteError } = await db
          .from("fcm_tokens")
          .delete()
          .eq("fcm_token", row.fcm_token)
        if (!deleteError) removed += 1
      }
    } catch (err: unknown) {
      failed += 1
      lastError = err instanceof Error ? err.message : String(err)
      console.warn("FCM send failed:", row.fcm_token, err)
    }
  }

  return { attempted: rows.length, sent, failed, removed, lastError }
}
