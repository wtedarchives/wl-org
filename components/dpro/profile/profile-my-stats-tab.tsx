"use client"

import { useAuth } from "@/components/auth-context"
import type { ProfileStatsTabSlug } from "@/components/dpro/profile/profile-stats-tab-config"
import { ProfileStatsTabPanel } from "@/components/dpro/profile/profile-stats-tab-panel"

export function ProfileMyStatsTab({ tab }: { tab: ProfileStatsTabSlug }) {
  const { session } = useAuth()
  return (
    <ProfileStatsTabPanel
      tab={tab}
      userId={session?.profileId ?? null}
      isOwnProfile
    />
  )
}
