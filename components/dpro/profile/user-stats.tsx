"use client"

import { useEffect, useId, useState, useMemo } from "react"
import { supabase } from "@/lib/supabase"

import { WlWidgetPanelLoading } from "@/components/dpro/wl-widget-panel-loading"
import { ProfileStatBox } from "@/components/dpro/profile/profile-stat-box"
import { WlHomeV2UserSongModal } from "@/components/wl-home-v2/wl-home-v2-user-song-modal"
import { useUserShows } from "@/hooks/use-user-shows"
import { useUserStats } from "@/hooks/use-user-stats"
import { getProfileUserStatCategoryClass } from "@/lib/profile-user-stat-wl-category"
import { getLoadingMessage } from "@/lib/utils/user-stats-utils"
import { cn } from "@/lib/utils"
import type { StatData } from "@/types/user-stats"

import "./profile-user-stats.css"

interface UserStatsProps {
  userId?: string | null
  effectiveUserId: string | null
  isOwnProfile: boolean
  showCopyButton?: boolean
  /**
   * Overview tab: single column of WL top-slots-style panels (parent provides grid).
   */
  overviewColumnLayout?: boolean
}

export function UserStats({
  userId,
  effectiveUserId,
  isOwnProfile,
  showCopyButton = true,
  overviewColumnLayout = false,
}: UserStatsProps) {
  const [username, setUsername] = useState<string | null>(null)
  const [songModalOpen, setSongModalOpen] = useState(false)
  const [songModalSongName, setSongModalSongName] = useState<string | null>(null)
  const [songModalSongDisplayName, setSongModalSongDisplayName] = useState<
    string | null
  >(null)
  const [songModalSongId, setSongModalSongId] = useState<string | null>(null)
  const userSongModalHeadingId = useId()
  const userSongModalScopeLineId = useId()

  const { shows } = useUserShows(effectiveUserId)
  const attendedShowIds = useMemo(
    () => shows.map((s) => s.show_id),
    [shows],
  )

  const handleSongClick = (
    songName: string,
    songDisplayName?: string | null,
    songId?: string,
  ) => {
    setSongModalSongName(songName)
    setSongModalSongDisplayName(songDisplayName ?? null)
    setSongModalSongId(songId ?? null)
    setSongModalOpen(true)
  }

  const {
    loading,
    topSongs,
    longestPerformances,
    showOpeners,
    setOpeners,
    setClosers,
    encoreSongs,
    notSeenSongs,
    loadingTop,
    loadingLongest,
    loadingShowOpeners,
    loadingSetOpeners,
    loadingSetClosers,
    loadingEncores,
    loadingNotSeen,
  } = useUserStats(effectiveUserId)

  useEffect(() => {
    if (!isOwnProfile && userId) {
      const client = supabase
      if (!client) return
      client
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .single()
        .then(({ data, error }) => {
          if (!error && data?.username) {
            setUsername(data.username)
          }
        })
    }
  }, [userId, isOwnProfile])

  const statData: StatData[] = [
    {
      type: "topSongs",
      title: "Most Seen Songs",
      data: topSongs,
      loading: loadingTop,
    },
    {
      type: "showOpeners",
      title: "Most Seen Show Openers",
      data: showOpeners,
      loading: loadingShowOpeners,
      countKey: "times_played",
      songNameKey: "song_name",
    },
    {
      type: "setOpeners",
      title: "Most Seen Set Openers",
      data: setOpeners,
      loading: loadingSetOpeners,
      countKey: "times_played",
      songNameKey: "song_name",
    },
    {
      type: "longestPerformances",
      title: "Longest Song Performances",
      data: longestPerformances,
      loading: loadingLongest,
      countKey: "length_seconds",
      showDate: true,
      showLength: true,
    },
    {
      type: "setClosers",
      title: "Most Seen Set Closers",
      data: setClosers,
      loading: loadingSetClosers,
      countKey: "times_played",
      songNameKey: "song_name",
    },
    {
      type: "encoreSongs",
      title: "Most Seen in the Encore",
      data: encoreSongs,
      loading: loadingEncores,
      countKey: "times_played",
      songNameKey: "song_name",
    },
    {
      type: "notSeenSongs",
      title: "Most Common Not Seen",
      data: notSeenSongs,
      loading: loadingNotSeen,
    },
  ]

  if (loading) {
    return (
      <WlWidgetPanelLoading
        message={getLoadingMessage(isOwnProfile, username)}
      />
    )
  }

  if (!effectiveUserId) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">No user data available.</p>
      </div>
    )
  }

  const hasNoData =
    topSongs.length === 0 &&
    longestPerformances.length === 0 &&
    showOpeners.length === 0 &&
    setOpeners.length === 0 &&
    setClosers.length === 0 &&
    encoreSongs.length === 0 &&
    notSeenSongs.length === 0

  if (hasNoData) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          {isOwnProfile
            ? "No stats available. Start adding shows you've attended!"
            : `${username ?? "This user"} hasn't added any attended shows yet.`}
        </p>
      </div>
    )
  }

  const songModal = (
    <WlHomeV2UserSongModal
      open={songModalOpen}
      onClose={() => setSongModalOpen(false)}
      headingId={userSongModalHeadingId}
      scopeLineId={userSongModalScopeLineId}
      songName={songModalSongName}
      songDisplayName={songModalSongDisplayName}
      songId={songModalSongId}
      userId={effectiveUserId}
      attendedShowIds={attendedShowIds}
      isOwnProfile={isOwnProfile}
    />
  )

  const OVERVIEW_STAT_GRID_ORDER = [
    "topSongs",
    "longestPerformances",
    "notSeenSongs",
    "showOpeners",
    "setOpeners",
    "setClosers",
    "encoreSongs",
  ] as const

  const OVERVIEW_STAT_NO_SWATCH = new Set<string>([
    "topSongs",
    "longestPerformances",
    "notSeenSongs",
  ])

  if (overviewColumnLayout) {
    const orderedOverviewStats = OVERVIEW_STAT_GRID_ORDER.map((t) =>
      statData.find((s) => s.type === t),
    ).filter((s): s is StatData => s != null)

    return (
      <>
        <div className="wl-home-v2-profile-overview-stats-grid">
          {orderedOverviewStats.map((stat) => (
            <div key={stat.type} className="wl-home-v2-profile-stat-slot">
              <ProfileStatBox
                stat={stat}
                showCopyButton={showCopyButton}
                onSongClick={
                  stat.type === "notSeenSongs" ? undefined : handleSongClick
                }
                variant="wlPanel"
                isOwnProfile={isOwnProfile}
                showCategorySwatch={!OVERVIEW_STAT_NO_SWATCH.has(stat.type)}
                wlCategoryClass={
                  OVERVIEW_STAT_NO_SWATCH.has(stat.type) ?
                    undefined
                  : getProfileUserStatCategoryClass(stat.type)
                }
              />
            </div>
          ))}
        </div>
        {songModal}
      </>
    )
  }

  return (
    <>
      <div className="wl-home-v2-profile-user-stats-grid">
        {statData.map((stat) => (
          <div
            key={stat.type}
            className={cn(
              "wl-home-v2-profile-stat-slot",
              `wl-home-v2-profile-stat-slot--${stat.type}`,
            )}
          >
            <ProfileStatBox
              stat={stat}
              showCopyButton={showCopyButton}
              onSongClick={
                stat.type === "notSeenSongs" ? undefined : handleSongClick
              }
            />
          </div>
        ))}
      </div>
      {songModal}
    </>
  )
}
