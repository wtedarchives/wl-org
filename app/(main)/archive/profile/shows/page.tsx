"use client"

import { useAuth } from "@/components/auth-context"
import { AttendedShows } from "@/components/dpro/profile/attended-shows"
import { AttendedByGroupChart } from "@/components/dpro/profile/attended-by-group-chart"
import { AttendanceStats } from "@/components/dpro/profile/attendance-stats"

export default function ProfileShowsPage() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const isOwnProfile = true

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AttendedShows
            userId={userId}
            isOwnProfile={isOwnProfile}
            readOnly={false}
          />
        </div>
        <div className="flex flex-col gap-6">
          <AttendedByGroupChart
            userId={userId}
            isOwnProfile={isOwnProfile}
          />
          <AttendanceStats
            userId={userId}
            isOwnProfile={isOwnProfile}
          />
        </div>
      </div>
    </div>
  )
}
