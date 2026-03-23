"use client"

import { useAuth } from "@/components/auth-context"
import { ProfileStatsTabPanel } from "@/components/dpro/profile/profile-stats-tab-panel"

export default function ProfileShowsPage() {
  const { user } = useAuth()
  const userId = user?.id ?? null

  return (
    <ProfileStatsTabPanel tab="shows" userId={userId} isOwnProfile />
  )
}
