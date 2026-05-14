"use client"

import { useEffect, useState } from "react"

import type { ProfileStatsTabSlug } from "@/components/dpro/profile/profile-stats-tab-config"

/**
 * Query-based profile tabs (`?tab=`) can diverge between static snapshot HTML and
 * the client, which breaks Radix `Tabs` hydration. Until mount, pin to `overview`
 * so server and first client paint match; then show the resolved tab.
 */
export function useHydratedProfileStatsTab(
  tab: ProfileStatsTabSlug,
): ProfileStatsTabSlug {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted ? tab : "overview"
}
