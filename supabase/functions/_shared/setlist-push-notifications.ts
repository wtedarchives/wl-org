import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import * as webpush from "jsr:@negrel/webpush@0.5.0"
import {
  buildSetlistNowPlayingSetSongLine,
  formatShowDateVenueLine,
  getSetlistArchiveAbsoluteUrl,
  type SetlistDiscourseShowEvent,
} from "./discourse-brains-chat.ts"

export type SetlistPushPayload = {
  title: string
  body: string
  url: string
}

const SHOW_EVENT_PUSH_TITLES: Record<SetlistDiscourseShowEvent, string> = {
  onstage: "[Band Onstage]",
  set_break: "[Set Break]",
  encore_break: "[Encore Break]",
  end_show: "[End of Show]",
}

export function buildSetlistNowPlayingPushNotification(
  showId: string,
  showDate: string,
  venueLocation: string | null | undefined,
  entrySet: string | null | undefined,
  entrySetnum: number,
  entrySong: string | null | undefined,
): SetlistPushPayload {
  const songName = (entrySong ?? "").trim() || "—"
  const setSongLine = buildSetlistNowPlayingSetSongLine(entrySet, entrySetnum)
  return {
    title: `♫ Now Playing: ${songName}`,
    body: `${formatShowDateVenueLine(showDate, venueLocation)}\n${setSongLine}`,
    url: getSetlistArchiveAbsoluteUrl(showId),
  }
}

export function buildSetlistShowEventPushNotification(
  showId: string,
  showDate: string,
  venueLocation: string | null | undefined,
  event: SetlistDiscourseShowEvent,
): SetlistPushPayload {
  return {
    title: SHOW_EVENT_PUSH_TITLES[event],
    body: formatShowDateVenueLine(showDate, venueLocation),
    url: getSetlistArchiveAbsoluteUrl(showId),
  }
}

type PushSubscriptionRow = {
  endpoint: string
  p256dh: string
  auth: string
}

function decodeBase64Url(value: string): Uint8Array {
  const padding = "=".repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/")
  const binary = atob(base64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i)
  }
  return out
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

/** Import VAPID keys produced by `npx web-push generate-vapid-keys` (base64url). */
async function importWebPushVapidKeyPair(
  publicKeyB64: string,
  privateKeyB64: string,
): Promise<CryptoKeyPair> {
  const publicKeyBytes = decodeBase64Url(publicKeyB64)
  const privateKeyBytes = decodeBase64Url(privateKeyB64)

  let publicKey: CryptoKey
  try {
    // web-push generate-vapid-keys uses SPKI DER for the public key.
    publicKey = await crypto.subtle.importKey(
      "spki",
      publicKeyBytes,
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["verify"],
    )
  } catch {
    // Fallback: uncompressed raw P-256 point (65 bytes, 0x04 prefix).
    publicKey = await crypto.subtle.importKey(
      "raw",
      publicKeyBytes,
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["verify"],
    )
  }

  let privateKey: CryptoKey
  try {
    // web-push generate-vapid-keys uses PKCS#8 DER for the private key.
    privateKey = await crypto.subtle.importKey(
      "pkcs8",
      privateKeyBytes,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["sign"],
    )
  } catch {
    if (privateKeyBytes.byteLength !== 32) {
      throw new Error("Unsupported VAPID private key format.")
    }
    const rawPublic = publicKeyBytes.byteLength === 65 ?
      publicKeyBytes
    : new Uint8Array(await crypto.subtle.exportKey("raw", publicKey))
    const x = rawPublic.slice(1, 33)
    const y = rawPublic.slice(33, 65)
    privateKey = await crypto.subtle.importKey(
      "jwk",
      {
        kty: "EC",
        crv: "P-256",
        x: encodeBase64Url(x),
        y: encodeBase64Url(y),
        d: encodeBase64Url(privateKeyBytes),
      },
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["sign"],
    )
  }

  return { publicKey, privateKey }
}

let cachedAppServer: webpush.ApplicationServer | null = null

async function getApplicationServer(): Promise<
  { ok: true; server: webpush.ApplicationServer } | { ok: false; error: string }
> {
  if (cachedAppServer) {
    return { ok: true, server: cachedAppServer }
  }

  const publicKey = Deno.env.get("VAPID_PUBLIC_KEY")?.trim()
  const privateKey = Deno.env.get("VAPID_PRIVATE_KEY")?.trim()
  const subject = Deno.env.get("VAPID_SUBJECT")?.trim()
  if (!publicKey || !privateKey || !subject) {
    return {
      ok: false,
      error: "Missing VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, or VAPID_SUBJECT.",
    }
  }

  try {
    const vapidKeys = await importWebPushVapidKeyPair(publicKey, privateKey)
    cachedAppServer = await webpush.ApplicationServer.new({
      contactInformation: subject,
      vapidKeys,
    })
    return { ok: true, server: cachedAppServer }
  } catch (err) {
    console.error("VAPID / ApplicationServer init failed:", err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to initialize push server.",
    }
  }
}

export type SendSetlistPushResult = {
  attempted: number
  sent: number
  failed: number
  removed: number
  skipped?: string
  lastError?: string
}

/** Sends a push to every opted-in subscriber. Never throws. */
export async function sendSetlistPushNotifications(
  db: SupabaseClient,
  payload: SetlistPushPayload,
): Promise<SendSetlistPushResult> {
  try {
    const app = await getApplicationServer()
    if (!app.ok) {
      console.warn("setlist push skipped:", app.error)
      return { attempted: 0, sent: 0, failed: 0, removed: 0, skipped: app.error }
    }

    const { data: enabledProfiles, error: profilesError } = await db
      .from("profiles")
      .select("id")
      .eq("push_notifications_enabled", true)

    if (profilesError) {
      console.error("setlist push profiles query:", profilesError)
      return {
        attempted: 0,
        sent: 0,
        failed: 0,
        removed: 0,
        skipped: profilesError.message,
      }
    }

    const profileIds = (enabledProfiles ?? []).map((row) => row.id as string)
    if (profileIds.length === 0) {
      return { attempted: 0, sent: 0, failed: 0, removed: 0, skipped: "no opted-in profiles" }
    }

    const { data: subscriptions, error: subsError } = await db
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .in("profile_id", profileIds)

    if (subsError) {
      console.error("setlist push subscriptions query:", subsError)
      return {
        attempted: 0,
        sent: 0,
        failed: 0,
        removed: 0,
        skipped: subsError.message,
      }
    }

    const rows = (subscriptions ?? []) as PushSubscriptionRow[]
    if (rows.length === 0) {
      return { attempted: 0, sent: 0, failed: 0, removed: 0, skipped: "no subscriptions" }
    }

    const pushBody = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url,
    })

    let sent = 0
    let failed = 0
    let removed = 0
    let lastError: string | undefined

    for (const row of rows) {
      try {
        const subscriber = app.server.subscribe({
          endpoint: row.endpoint,
          keys: { p256dh: row.p256dh, auth: row.auth },
        })
        await subscriber.pushTextMessage(pushBody, {
          urgency: webpush.Urgency.High,
          ttl: 60 * 60 * 24,
        })
        sent += 1
      } catch (err: unknown) {
        failed += 1
        lastError = err instanceof Error ? err.message : String(err)
        if (err instanceof webpush.PushMessageError && err.isGone()) {
          const { error: deleteError } = await db
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", row.endpoint)
          if (!deleteError) removed += 1
        }
        console.warn("setlist push send failed:", row.endpoint, err)
      }
    }

    return { attempted: rows.length, sent, failed, removed, lastError }
  } catch (err) {
    console.error("setlist push unexpected error:", err)
    return {
      attempted: 0,
      sent: 0,
      failed: 0,
      removed: 0,
      skipped: err instanceof Error ? err.message : "unexpected push error",
    }
  }
}
