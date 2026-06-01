import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import webpush from "npm:web-push@3.6.7"
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

function configureWebPush(): { ok: true } | { ok: false; error: string } {
  const publicKey = Deno.env.get("VAPID_PUBLIC_KEY")?.trim()
  const privateKey = Deno.env.get("VAPID_PRIVATE_KEY")?.trim()
  const subject = Deno.env.get("VAPID_SUBJECT")?.trim()
  if (!publicKey || !privateKey || !subject) {
    return {
      ok: false,
      error: "Missing VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, or VAPID_SUBJECT.",
    }
  }
  webpush.setVapidDetails(subject, publicKey, privateKey)
  return { ok: true }
}

export type SendSetlistPushResult = {
  attempted: number
  sent: number
  failed: number
  removed: number
  skipped?: string
}

/** Sends a push to every opted-in subscriber. Does not throw on partial failure. */
export async function sendSetlistPushNotifications(
  db: SupabaseClient,
  payload: SetlistPushPayload,
): Promise<SendSetlistPushResult> {
  const configured = configureWebPush()
  if (!configured.ok) {
    console.warn("setlist push skipped:", configured.error)
    return { attempted: 0, sent: 0, failed: 0, removed: 0, skipped: configured.error }
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
    return { attempted: 0, sent: 0, failed: 0, removed: 0 }
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
    return { attempted: 0, sent: 0, failed: 0, removed: 0 }
  }

  const pushBody = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url,
  })

  let sent = 0
  let failed = 0
  let removed = 0

  for (const row of rows) {
    try {
      await webpush.sendNotification(
        {
          endpoint: row.endpoint,
          keys: { p256dh: row.p256dh, auth: row.auth },
        },
        pushBody,
        { TTL: 60 * 60 * 24 },
      )
      sent += 1
    } catch (err: unknown) {
      failed += 1
      const status = (err as { statusCode?: number })?.statusCode
      if (status === 404 || status === 410) {
        const { error: deleteError } = await db
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", row.endpoint)
        if (!deleteError) removed += 1
      }
      console.warn("setlist push send failed:", row.endpoint, err)
    }
  }

  return { attempted: rows.length, sent, failed, removed }
}
