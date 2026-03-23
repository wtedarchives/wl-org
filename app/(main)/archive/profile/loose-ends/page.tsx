"use client"

import { useAuth } from "@/components/auth-context"
import { ProfileStatsTabPanel } from "@/components/dpro/profile/profile-stats-tab-panel"

export default function ProfileLooseEndsPage() {
  const { user } = useAuth()

  return (
    <ProfileStatsTabPanel
      tab="loose-ends"
      userId={user?.id ?? null}
      isOwnProfile
    />
  )
}
