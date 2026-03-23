"use client"

import { Suspense } from "react"
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
      fallback={
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
        </div>
      }
    >
      <ProfileSongsPageInner />
    </Suspense>
  )
}
