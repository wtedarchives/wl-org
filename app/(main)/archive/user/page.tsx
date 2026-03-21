"use client"

import { useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { AttendedShows } from "@/components/dpro/profile/attended-shows"
import { AttendedByGroupChart } from "@/components/dpro/profile/attended-by-group-chart"
import { AttendanceStats } from "@/components/dpro/profile/attendance-stats"
import { useEffect, useState, Suspense } from "react"
import { supabase } from "@/lib/supabase"

function UserProfileContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const { user } = useAuth()
  const [username, setUsername] = useState<string | null>(null)

  const isOwnProfile = user?.id === id
  const userId = id ?? null

  useEffect(() => {
    if (id) {
      supabase
        ?.from("profiles")
        .select("username")
        .eq("id", id)
        .single()
        .then(({ data, error }) => {
          if (!error && data?.username) setUsername(data.username)
        })
    }
  }, [id])

  if (!userId) {
    return (
      <div className="flex flex-col gap-6 rounded-b-none p-4 md:rounded-b-xl md:p-6">
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No user ID provided. Use a share link to view a user&apos;s profile.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 rounded-b-none p-4 md:rounded-b-xl md:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-lg font-semibold">
          {isOwnProfile ? "My Stats" : `${username ?? "User"}'s Stats`}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isOwnProfile
            ? "Your attended shows and stats."
            : "Viewing another user's attended shows (read-only)."}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AttendedShows
            userId={userId}
            isOwnProfile={!!isOwnProfile}
            username={username}
            readOnly={!isOwnProfile}
          />
        </div>
        <div className="flex flex-col gap-6">
          <AttendedByGroupChart
            userId={userId}
            isOwnProfile={!!isOwnProfile}
            username={username}
          />
          <AttendanceStats
            userId={userId}
            isOwnProfile={!!isOwnProfile}
            username={username}
          />
        </div>
      </div>
    </div>
  )
}

export default function UserProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
        </div>
      }
    >
      <UserProfileContent />
    </Suspense>
  )
}
