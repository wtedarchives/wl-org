"use client"

import { useAuth } from "@/components/auth-context"

import { OverviewChart } from "@/components/dpro/profile/overview-chart"
import { UserStats } from "@/components/dpro/profile/user-stats"

export default function ProfileOverviewPage() {
  const { user } = useAuth()
  const userId = user?.id ?? null

  return (
    <div className="flex flex-col gap-6">
      <OverviewChart
        userId={userId}
        isOwnProfile={true}
      />
      <UserStats
        userId={userId}
        effectiveUserId={userId}
        isOwnProfile={true}
        showCopyButton={true}
      />
    </div>
  )
}
