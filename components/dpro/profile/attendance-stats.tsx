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
  refetchKey?: number
}

export function AttendanceStats({
  userId,
  isOwnProfile,
  username,
  refetchKey = 0,
}: AttendanceStatsProps) {
  const { data, loading, loadingProgress } = useAttendanceStats(
    userId,
    refetchKey
  )
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
    <Card className="overflow-hidden py-0">
      <CardHeader className="bg-muted/60 py-2">
        <CardTitle className="text-sm font-medium">Canonical Attendance Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-3">
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5 shrink-0" />
              Shows Attended
            </span>
            <span className="inline-block rounded px-1.5 py-[1px] tabular-nums font-medium text-foreground bg-muted/60 ring-1 ring-border/50">
              {data.showsCount}
            </span>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <Building2 className="size-3.5 shrink-0" />
              Venues Visited
            </span>
            <span className="inline-block rounded px-1.5 py-[1px] tabular-nums font-medium text-foreground bg-muted/60 ring-1 ring-border/50">
              {data.venuesCount}
            </span>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <Music className="size-3.5 shrink-0" />
              Songs Seen
            </span>
            <span className="inline-block rounded px-1.5 py-[1px] tabular-nums font-medium text-foreground bg-muted/60 ring-1 ring-border/50">
              {data.songsCount}
            </span>
          </li>
        </ul>

        <div>
          <h4 className="mb-2 text-xs font-semibold">Tours Attended</h4>
          {data.tourCounts.length === 0 ? (
            <p className="pl-3 text-xs italic text-muted-foreground">
              {noToursMsg}
            </p>
          ) : (
            <ul className="space-y-0.5 pl-3">
              {data.tourCounts.map((tour) => (
                <li key={tour.tour}>
                  <Link
                    href={`/archive/tours/${tour.tour_id}`}
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
