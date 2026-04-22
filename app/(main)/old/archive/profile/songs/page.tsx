"use client"

import { Suspense } from "react"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { useAuth } from "@/components/auth-context"
import { ProfileStatsTabPanel } from "@/components/dpro/profile/profile-stats-tab-panel"

function ProfileSongsPageInner() {
  const { user } = useAuth()
  const userId = user?.id ?? null

  return (
    <ProfileStatsTabPanel tab="songs" userId={userId} isOwnProfile />
  )
}

export default function ProfileSongsPage() {
  return (
    <Suspense
      fallback={<LoadingPageCard message="Loading songs data…" />}
    >
      <ProfileSongsPageInner />
    </Suspense>
  )
}
