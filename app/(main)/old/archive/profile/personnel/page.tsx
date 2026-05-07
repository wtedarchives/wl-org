"use client"

import { useAuth } from "@/components/auth-context"
import { ProfileStatsTabPanel } from "@/components/dpro/profile/profile-stats-tab-panel"

export default function ProfilePersonnelPage() {
  const { user } = useAuth()
  const userId = session?.profileId ?? null

  return (
    <ProfileStatsTabPanel tab="personnel" userId={userId} isOwnProfile />
  )
}
