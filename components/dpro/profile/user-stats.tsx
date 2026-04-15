"use client"

import { useEffect, useState, useMemo } from "react"
import { supabase } from "@/lib/supabase"

import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { ProfileStatBox } from "@/components/dpro/profile/profile-stat-box"
import { UserSongPerformancesSheet } from "@/components/dpro/profile/user-song-performances-sheet"
import { useUserShows } from "@/hooks/use-user-shows"
import { useUserStats } from "@/hooks/use-user-stats"
import { getLoadingMessage } from "@/lib/utils/user-stats-utils"
import type { StatData } from "@/types/user-stats"

interface UserStatsProps {
  userId?: string | null
  effectiveUserId: string | null
  isOwnProfile: boolean
  showCopyButton?: boolean
}

const MOBILE_ORDER: Record<string, number> = {
  topSongs: 1,
  longestPerformances: 2,
  showOpeners: 3,
  setOpeners: 4,
  setClosers: 5,
  encoreSongs: 6,
  notSeenSongs: 7,
}

export function UserStats({
  userId,
  effectiveUserId,
  isOwnProfile,
  showCopyButton = true,
}: UserStatsProps) {
  const [username, setUsername] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetSongName, setSheetSongName] = useState<string | null>(null)
  const [sheetSongDisplayName, setSheetSongDisplayName] = useState<
    string | null
  >(null)
  const [sheetSongId, setSheetSongId] = useState<string | null>(null)

  const { shows } = useUserShows(effectiveUserId)
  const attendedShowIds = useMemo(
    () => shows.map((s) => s.show_id),
    [shows]
  )

  const handleSongClick = (
    songName: string,
    songDisplayName?: string | null,
    songId?: string
  ) => {
    setSheetSongName(songName)
    setSheetSongDisplayName(songDisplayName ?? null)
    setSheetSongId(songId ?? null)
    setSheetOpen(true)
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
      <LoadingPageCard message={getLoadingMessage(isOwnProfile, username)} />
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

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {statData.map((stat, index) => (
          <div
            key={stat.type}
            className="min-h-[200px]"
            style={{
              order: MOBILE_ORDER[stat.type] ?? index + 1,
            }}
          >
            <ProfileStatBox
              stat={stat}
              showCopyButton={showCopyButton}
              onSongClick={handleSongClick}
            />
          </div>
        ))}
      </div>

      <UserSongPerformancesSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        songName={sheetSongName}
        songDisplayName={sheetSongDisplayName}
        songId={sheetSongId}
        userId={effectiveUserId}
        attendedShowIds={attendedShowIds}
        isOwnProfile={isOwnProfile}
      />
    </>
  )
}
