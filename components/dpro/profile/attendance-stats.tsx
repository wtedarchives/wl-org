"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Calendar, Building2, Music } from "lucide-react"
import { supabase } from "@/lib/supabase"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { useAttendanceStats } from "@/hooks/use-attendance-stats"

interface AttendanceStatsProps {
  userId: string | null
  isOwnProfile: boolean
  username?: string | null
}

export function AttendanceStats({
  userId,
  isOwnProfile,
  username,
}: AttendanceStatsProps) {
  const { data, loading, loadingProgress } = useAttendanceStats(userId)
  const [displayUsername, setDisplayUsername] = useState<string | null>(null)

  useEffect(() => {
    if (!isOwnProfile && userId) {
      supabase
        ?.from("profiles")
        .select("username")
        .eq("id", userId)
        .single()
        .then(({ data: d, error }) => {
          if (!error && d?.username) setDisplayUsername(d.username)
        })
    }
  }, [userId, isOwnProfile])

  const loadingMsg = isOwnProfile
    ? "Loading stats…"
    : `Loading ${displayUsername ? `${displayUsername}'s` : "their"} stats…`

  const noToursMsg = isOwnProfile
    ? "No tour data available"
    : displayUsername
      ? `${displayUsername} hasn't attended any tours yet`
      : "No tour data available"

  if (loading) {
    return <LoadingPageCard message={loadingMsg} progress={loadingProgress} />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Attendance Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
            <Calendar className="size-5 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">
                Shows Attended
              </p>
              <p className="text-sm font-semibold tabular-nums">
                {data.showsCount}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
            <Building2 className="size-5 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">
                Venues Visited
              </p>
              <p className="text-sm font-semibold tabular-nums">
                {data.venuesCount}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
            <Music className="size-5 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">
                Songs Seen
              </p>
              <p className="text-sm font-semibold tabular-nums">
                {data.songsCount}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="mb-2 text-xs font-semibold">Tours Attended</h4>
          {data.tourCounts.length === 0 ? (
            <p className="text-xs italic text-muted-foreground">
              {noToursMsg}
            </p>
          ) : (
            <ul className="space-y-1">
              {data.tourCounts.map((tour) => (
                <li key={tour.tour}>
                  <Link
                    href={`/dpro/tours/${tour.tour_id}`}
                    className="text-xs font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {tour.tour}
                  </Link>
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({tour.count})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
