import type { ProfileStatsTabSlug } from "@/components/dpro/profile/profile-stats-tab-config"

/**
 * Builds the canonical URL for a user's public profile (`/user?id=&tab=`).
 * Used for share links and navigation.
 */
export function getUserProfileUrl(
  userId: string,
  base?: string,
  tab: ProfileStatsTabSlug = "overview",
): string {
  const q = new URLSearchParams()
  q.set("id", userId)
  q.set("tab", tab)
  const path = `/user?${q.toString()}`
  if (base) {
    return `${base.replace(/\/$/, "")}${path}`
  }
  return path
}
