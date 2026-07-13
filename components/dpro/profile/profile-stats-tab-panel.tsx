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
// Rankings tab temporarily disabled (see profile-stats-tab-config.ts):
// import { SongRankings } from "@/components/dpro/profile/song-rankings"
import type { ProfileStatsTabSlug } from "@/components/dpro/profile/profile-stats-tab-config"

import "./profile-overview-tab.css"
import "./profile-shows-tab.css"
import "./profile-slots-tab.css"
import "./profile-personnel-tab.css"
import "./profile-loose-ends-tab.css"
import "./profile-rankings-tab.css"

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
        <div className="wl-home-v2-profile-overview-tab">
          <div className="wl-home-v2-profile-overview-tab__chart">
            <OverviewChart
              userId={userId}
              isOwnProfile={isOwnProfile}
              username={username}
            />
          </div>
          <div className="wl-home-v2-profile-overview-tab__stats">
            <UserStats
              userId={userId}
              effectiveUserId={userId}
              isOwnProfile={isOwnProfile}
              showCopyButton={isOwnProfile}
              overviewColumnLayout
            />
          </div>
        </div>
      )
    case "shows":
      return (
        <div className="wl-home-v2-profile-shows-tab">
          <div className="wl-home-v2-profile-shows-tab__section">
            <div className="wl-home-v2-profile-shows-tab__grid">
              <div className="wl-home-v2-profile-shows-tab__main">
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
              <div className="wl-home-v2-profile-shows-tab__sidebar">
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
        </div>
      )
    case "songs":
      return (
        <ProfileSongsTabContent
          userId={userId}
          isOwnProfile={isOwnProfile}
        />
      )
    case "slots":
      return (
        <div className="wl-home-v2-profile-slots-tab">
          <div className="wl-home-v2-profile-slots-tab__section">
            <UserSlots
              userId={userId}
              effectiveUserId={userId}
              isOwnProfile={isOwnProfile}
            />
          </div>
        </div>
      )
    case "personnel":
      return (
        <div className="wl-home-v2-profile-personnel-tab">
          <div className="wl-home-v2-profile-personnel-tab__section">
            <UserPersonnel
              userId={userId}
              effectiveUserId={userId}
              isOwnProfile={isOwnProfile}
            />
          </div>
        </div>
      )
    case "badges":
      return (
        <div className="wl-home-v2-profile-loose-ends-tab">
          <div className="wl-home-v2-profile-loose-ends-tab__section">
            <LooseEndsContent userId={userId} isOwnProfile={isOwnProfile} />
          </div>
        </div>
      )
    // Rankings tab temporarily disabled — hidden from the tab bar via
    // profile-stats-tab-config.ts (which also drops "rankings" from
    // ProfileStatsTabSlug, so this case is intentionally commented out).
    // Retained for easy re-enable:
    // case "rankings":
    //   if (!userId) return null
    //   return (
    //     <div className="wl-home-v2-profile-rankings-tab">
    //       <div className="wl-home-v2-profile-rankings-tab__section">
    //         <SongRankings userId={userId} isOwnProfile={isOwnProfile} />
    //       </div>
    //     </div>
    //   )
    default:
      return null
  }
}
