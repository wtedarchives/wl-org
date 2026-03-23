"use client"

import { useState } from "react"

import { OverviewChart } from "@/components/dpro/profile/overview-chart"
import { UserStats } from "@/components/dpro/profile/user-stats"
import { AttendedShows } from "@/components/dpro/profile/attended-shows"
import { AttendedByGroupChart } from "@/components/dpro/profile/attended-by-group-chart"
import { AttendanceStats } from "@/components/dpro/profile/attendance-stats"
import { UserSlots } from "@/components/dpro/profile/user-slots"
import { UserPersonnel } from "@/components/dpro/profile/user-personnel"
import { LooseEndsContent } from "@/components/dpro/profile/loose-ends-content"
import { ProfileSongsTabContent } from "@/components/dpro/profile/profile-songs-tab-content"
import type { ProfileStatsTabSlug } from "@/components/dpro/profile/profile-stats-tab-config"

export interface ProfileStatsTabPanelProps {
  tab: ProfileStatsTabSlug
  userId: string | null
  isOwnProfile: boolean
  username?: string | null
}

export function ProfileStatsTabPanel({
  tab,
  userId,
  isOwnProfile,
  username = null,
}: ProfileStatsTabPanelProps) {
  const [sidebarRefetchKey, setSidebarRefetchKey] = useState(0)

  const handleManagingToggle = (isManaging: boolean) => {
    if (!isManaging) {
      setSidebarRefetchKey((k) => k + 1)
    }
  }

  switch (tab) {
    case "overview":
      return (
        <div className="flex flex-col gap-6">
          <OverviewChart
            userId={userId}
            isOwnProfile={isOwnProfile}
            username={username}
          />
          <UserStats
            userId={userId}
            effectiveUserId={userId}
            isOwnProfile={isOwnProfile}
            showCopyButton={isOwnProfile}
          />
        </div>
      )
    case "shows":
      return (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-4 xl:items-start">
            <div className="xl:col-span-3">
              <AttendedShows
                userId={userId}
                isOwnProfile={isOwnProfile}
                username={username}
                readOnly={!isOwnProfile}
                onManagingToggle={
                  isOwnProfile ? handleManagingToggle : undefined
                }
              />
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-1">
              <AttendedByGroupChart
                userId={userId}
                isOwnProfile={isOwnProfile}
                username={username}
                refetchKey={sidebarRefetchKey}
              />
              <AttendanceStats
                userId={userId}
                isOwnProfile={isOwnProfile}
                username={username}
                refetchKey={sidebarRefetchKey}
              />
            </div>
          </div>
        </div>
      )
    case "songs":
      return (
        <ProfileSongsTabContent userId={userId} isOwnProfile={isOwnProfile} />
      )
    case "slots":
      return (
        <UserSlots
          userId={userId}
          effectiveUserId={userId}
          isOwnProfile={isOwnProfile}
        />
      )
    case "personnel":
      return (
        <UserPersonnel
          userId={userId}
          effectiveUserId={userId}
          isOwnProfile={isOwnProfile}
        />
      )
    case "loose-ends":
      return (
        <LooseEndsContent userId={userId} isOwnProfile={isOwnProfile} />
      )
    default:
      return null
  }
}
