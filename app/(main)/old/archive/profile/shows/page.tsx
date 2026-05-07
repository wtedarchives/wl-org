"use client"

import { useAuth } from "@/components/auth-context"
import { ProfileStatsTabPanel } from "@/components/dpro/profile/profile-stats-tab-panel"

export default function ProfileShowsPage() {
  const { session } = useAuth()
  const userId = session?.profileId ?? null

  return (
    <ProfileStatsTabPanel tab="shows" userId={userId} isOwnProfile />
  )
}
