export type SendSetlistPushResult = {
  attempted: number
  sent: number
  failed: number
  removed: number
  skipped?: string
  lastError?: string
}

/** Admin toast copy for push delivery stats returned by dpro-admin. */
export function formatSetlistPushAdminToast(
  push: SendSetlistPushResult | undefined,
): string | null {
  if (!push) return null
  if (push.skipped) {
    return `Push skipped: ${push.skipped}`
  }
  if (push.attempted === 0) {
    return "Push: no subscribers"
  }
  if (push.sent > 0) {
    return `Push sent to ${push.sent} device${push.sent === 1 ? "" : "s"}`
  }
  if (push.lastError) {
    return `Push failed: ${push.lastError}`
  }
  return `Push failed for ${push.failed} device${push.failed === 1 ? "" : "s"}`
}

export type SetlistDiscourseResult = {
  posted: boolean
  /** Already announced on an earlier press — Discourse and push were not re-sent. */
  skipped: boolean
  error?: string
}

export type SetlistBlueskyResult = {
  status: "created" | "updated" | "disabled" | "failed"
  uri?: string
  error?: string
}

/** `dpro-admin` payload shared by the brain button and the show-event buttons. */
export type SetlistBrainResponse = {
  discourse?: SetlistDiscourseResult
  push?: SendSetlistPushResult
  bluesky?: SetlistBlueskyResult
}

/**
 * Per-target toast copy. Targets are independent, so one can fail while the
 * others land — the button shows ✗ only when something actually failed.
 * A `disabled` Bluesky result is silent: the kill switch is off on purpose.
 */
export function formatSetlistBrainToasts(
  response: SetlistBrainResponse | null | undefined,
): {
  success: string[]
  error: string[]
  failed: boolean
} {
  const success: string[] = []
  const error: string[] = []
  if (!response) return { success, error, failed: false }

  const { discourse, push, bluesky } = response

  if (discourse?.error) {
    error.push(`Discourse failed: ${discourse.error}`)
  } else if (discourse?.skipped) {
    success.push("Discourse + push already sent — skipped")
  }

  const pushMessage = formatSetlistPushAdminToast(push)
  if (pushMessage) success.push(pushMessage)

  if (bluesky?.status === "created") {
    success.push("Bluesky: posted to thread")
  } else if (bluesky?.status === "updated") {
    success.push("Bluesky: post updated")
  } else if (bluesky?.status === "failed") {
    error.push(`Bluesky failed: ${bluesky.error ?? "unknown error"}`)
  }

  return { success, error, failed: error.length > 0 }
}
