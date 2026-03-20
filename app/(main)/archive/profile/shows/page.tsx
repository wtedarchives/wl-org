"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-context"
import { AttendedShows } from "@/components/dpro/profile/attended-shows"
import { AttendedByGroupChart } from "@/components/dpro/profile/attended-by-group-chart"
import { AttendanceStats } from "@/components/dpro/profile/attendance-stats"

export default function ProfileShowsPage() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const isOwnProfile = true
  const [sidebarRefetchKey, setSidebarRefetchKey] = useState(0)

  const handleManagingToggle = (isManaging: boolean) => {
    if (!isManaging) {
      setSidebarRefetchKey((k) => k + 1)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="xl:col-span-3">
          <AttendedShows
            userId={userId}
            isOwnProfile={isOwnProfile}
            readOnly={false}
            onManagingToggle={handleManagingToggle}
          />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-1">
          <AttendedByGroupChart
            userId={userId}
            isOwnProfile={isOwnProfile}
            refetchKey={sidebarRefetchKey}
          />
          <AttendanceStats
            userId={userId}
            isOwnProfile={isOwnProfile}
            refetchKey={sidebarRefetchKey}
          />
        </div>
      </div>
    </div>
  )
}
