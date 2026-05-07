"use client"

import { useAuth } from "@/components/auth-context"
import { ProfileStatsTabPanel } from "@/components/dpro/profile/profile-stats-tab-panel"

export default function ProfileLooseEndsPage() {
  const { session } = useAuth()

  return (
    <ProfileStatsTabPanel
      tab="loose-ends"
      userId={session?.profileId ?? null}
      isOwnProfile
    />
  )
}
