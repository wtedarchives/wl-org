"use client"

import { useAuth } from "@/components/auth-context"
import { ProfileStatsTabPanel } from "@/components/dpro/profile/profile-stats-tab-panel"

export default function ProfileSlotsPage() {
  const { user } = useAuth()
  const userId = session?.profileId ?? null

  return (
    <ProfileStatsTabPanel tab="slots" userId={userId} isOwnProfile />
  )
}
