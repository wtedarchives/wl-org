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
