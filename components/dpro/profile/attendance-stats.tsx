"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Ticket } from "@phosphor-icons/react"
import { Calendar, Building2, Music } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getTourArchiveUrl } from "@/lib/tour-archive-url"

import { WlWidgetPanelLoading } from "@/components/dpro/wl-widget-panel-loading"
import { cn } from "@/lib/utils"
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
  username: _username,
  refetchKey = 0,
}: AttendanceStatsProps) {
  const { data, loading, loadingProgress } = useAttendanceStats(
    userId,
    refetchKey,
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

  const panelPadClass = isOwnProfile
    ? "wl-home-v2-profile-shows-panel--own"
    : "wl-home-v2-profile-shows-panel--public"

  if (loading) {
    return (
      <WlWidgetPanelLoading message={loadingMsg} progress={loadingProgress} />
    )
  }

  if (!userId) {
    return (
      <div
        className={cn(
          "widget-panel wl-home-v2-profile-shows-stats",
          panelPadClass,
        )}
      >
        <div className="wp-head wl-home-v2-years-shows-wp-head">
          <span className="min-w-0 truncate">Canonical Attendance Stats</span>
        </div>
        <div className="wl-home-v2-profile-shows-stat-empty">
          <p className="wl-home-v2-profile-shows-stat-empty-msg">
            Please log in to see attendance stats.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "widget-panel wl-home-v2-profile-shows-stats",
        panelPadClass,
      )}
    >
      <div className="wp-head wl-home-v2-years-shows-wp-head">
        <span className="min-w-0 truncate">Canonical Attendance Stats</span>
      </div>
      <div className="wl-home-v2-profile-shows-stats-body">
        <ul className="wl-home-v2-profile-shows-stats-list">
          <li>
            <span className="wl-home-v2-profile-shows-stats-list-label">
              <Calendar
                className="wl-home-v2-profile-shows-stats-list-icon"
                aria-hidden
              />
              Shows Attended
            </span>
            <span className="wl-home-v2-profile-shows-stat-pill">
              {data.showsCount}
            </span>
          </li>
          {data.upcomingShowsCount > 0 ?
            <li>
              <span className="wl-home-v2-profile-shows-stats-list-label">
                <Ticket
                  className="wl-home-v2-profile-shows-stats-list-icon"
                  aria-hidden
                />
                Upcoming Shows
              </span>
              <span className="wl-home-v2-profile-shows-stat-pill">
                {data.upcomingShowsCount}
              </span>
            </li>
          : null}
          <li>
            <span className="wl-home-v2-profile-shows-stats-list-label">
              <Building2
                className="wl-home-v2-profile-shows-stats-list-icon"
                aria-hidden
              />
              Venues Visited
            </span>
            <span className="wl-home-v2-profile-shows-stat-pill">
              {data.venuesCount}
            </span>
          </li>
          <li>
            <span className="wl-home-v2-profile-shows-stats-list-label">
              <Music
                className="wl-home-v2-profile-shows-stats-list-icon"
                aria-hidden
              />
              Songs Seen
            </span>
            <span className="wl-home-v2-profile-shows-stat-pill">
              {data.songsCount}
            </span>
          </li>
        </ul>
      </div>
      <div
        className={cn(
          "wp-head wl-home-v2-years-shows-wp-head",
          "wl-home-v2-profile-shows-stats-tours-head",
        )}
      >
        <span className="min-w-0 truncate">Tours Attended</span>
      </div>
      <div className="wl-home-v2-profile-shows-stats-body">
        {data.tourCounts.length === 0 ?
          <p className="wl-home-v2-profile-shows-tours-none">{noToursMsg}</p>
        : <ul className="wl-home-v2-profile-shows-tours-list">
            {data.tourCounts.map((tour) => (
              <li key={tour.tour}>
                <Link
                  href={getTourArchiveUrl(tour.tour_id)}
                  className="text-[0.75rem] font-medium text-white hover:underline"
                >
                  {tour.tour}
                </Link>
                <span className="wl-home-v2-profile-shows-tours-count">
                  ({tour.count})
                </span>
              </li>
            ))}
          </ul>
        }
      </div>
    </div>
  )
}
