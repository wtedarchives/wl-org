export const PROFILE_STATS_TABS = [
  { slug: "overview", label: "Overview" },
  { slug: "shows", label: "Shows" },
  { slug: "songs", label: "Songs" },
  { slug: "slots", label: "Slots" },
  { slug: "personnel", label: "Personnel" },
  { slug: "loose-ends", label: "Loose Ends" },
] as const

export type ProfileStatsTabSlug = (typeof PROFILE_STATS_TABS)[number]["slug"]

export function isProfileStatsTabSlug(s: string): s is ProfileStatsTabSlug {
  return PROFILE_STATS_TABS.some((t) => t.slug === s)
}

export function getProfileStatsActiveTab(
  pathname: string | null | undefined
): ProfileStatsTabSlug {
  const segment = pathname?.split("/").pop() ?? ""
  if (segment && isProfileStatsTabSlug(segment)) return segment
  return "overview"
}
