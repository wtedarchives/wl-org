export const PROFILE_STATS_TABS = [
  { slug: "overview", label: "Overview" },
  { slug: "shows", label: "Shows" },
  { slug: "songs", label: "Songs" },
  { slug: "slots", label: "Slots" },
  { slug: "personnel", label: "Personnel" },
  { slug: "badges", label: "Badges" },
  // Rankings tab temporarily disabled — hidden from both personal and public
  // profiles. Uncomment to restore (also re-enable the `case "rankings"` block
  // and the `SongRankings` import in profile-stats-tab-panel.tsx).
  // { slug: "rankings", label: "Rankings" },
] as const

export type ProfileStatsTabSlug = (typeof PROFILE_STATS_TABS)[number]["slug"]

const PROFILE_STATS_TAB_LEGACY_ALIASES: Partial<Record<string, ProfileStatsTabSlug>> = {
  "loose-ends": "badges",
}

/** Map legacy `?tab=` or path segments (e.g. `loose-ends`) to the current slug. */
export function canonicalProfileStatsTabParam(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ""
  return PROFILE_STATS_TAB_LEGACY_ALIASES[trimmed] ?? trimmed
}

export function isProfileStatsTabSlug(s: string): s is ProfileStatsTabSlug {
  return PROFILE_STATS_TABS.some((t) => t.slug === s)
}

/** Path-based profile URLs (e.g. `/archive/profile/overview`) **301** to `?tab=`; canonical My Stats is `/archive/profile?tab=`. */
export function getProfileStatsActiveTab(
  pathname: string | null | undefined
): ProfileStatsTabSlug {
  const segment = pathname?.split("/").pop() ?? ""
  const canonical = canonicalProfileStatsTabParam(segment)
  if (canonical && isProfileStatsTabSlug(canonical)) return canonical
  return "overview"
}
