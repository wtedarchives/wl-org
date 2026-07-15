import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import {
  buildSetlistNowPlayingSetSongLine,
  formatShowDateVenueLine,
  getSetlistArchiveAbsoluteUrl,
  type SetlistDiscourseShowEvent,
} from "./discourse-brains-chat.ts"
import { getApnsConfig, isDeadTokenReason, sendApns } from "./apns.ts"

export type SetlistPushPayload = {
  title: string
  body: string
  url: string
  showID: string
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
    showID: showId,
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
    showID: showId,
  }
}

type ApnsTokenRow = {
  device_token: string
  environment: string | null
}

export type SendSetlistPushResult = {
  attempted: number
  sent: number
  failed: number
  removed: number
  skipped?: string
  lastError?: string
}

/** Sends an APNs push to every registered device. Never throws. */
export async function sendSetlistPushNotifications(
  db: SupabaseClient,
  payload: SetlistPushPayload,
): Promise<SendSetlistPushResult> {
  try {
    const apns = await getApnsConfig()
    if (!apns.ok) {
      console.warn("setlist push skipped:", apns.error)
      return { attempted: 0, sent: 0, failed: 0, removed: 0, skipped: apns.error }
    }

    const { data: tokens, error: tokensError } = await db
      .from("apns_tokens")
      .select("device_token, environment")

    if (tokensError) {
      console.error("setlist push tokens query:", tokensError)
      return { attempted: 0, sent: 0, failed: 0, removed: 0, skipped: tokensError.message }
    }

    const rows = (tokens ?? []) as ApnsTokenRow[]
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
        console.warn("setlist push send failed:", row.device_token, err)
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
