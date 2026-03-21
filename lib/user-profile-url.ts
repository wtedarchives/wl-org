/**
 * Builds the canonical URL for a user's public profile.
 * Used for share links and navigation.
 */
export function getUserProfileUrl(userId: string, base?: string): string {
  const path = `/archive/user?id=${encodeURIComponent(userId)}`
  if (base) {
    return `${base.replace(/\/$/, "")}${path}`
  }
  return path
}
