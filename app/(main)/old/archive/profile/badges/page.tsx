"use client"

import { useAuth } from "@/components/auth-context"
import { ProfileStatsTabPanel } from "@/components/dpro/profile/profile-stats-tab-panel"

export default function ProfileBadgesPage() {
  const { session } = useAuth()

  return (
    <ProfileStatsTabPanel
      tab="badges"
      userId={session?.profileId ?? null}
      isOwnProfile
    />
  )
}
