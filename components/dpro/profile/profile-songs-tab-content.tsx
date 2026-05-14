"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { WlWidgetPanelLoading } from "@/components/dpro/wl-widget-panel-loading"
import { UserSongsCombined } from "@/components/dpro/profile/user-songs-combined"
import { UserSongPerformancesSheet } from "@/components/dpro/profile/user-song-performances-sheet"
import { UserSongSpread } from "@/components/dpro/profile/user-song-spread"
import { useUserShows } from "@/hooks/use-user-shows"
import { useUserSongsData } from "@/hooks/use-user-songs-data"
import { useUserSongMatrix, type UserMatrixSortMode } from "@/hooks/use-user-song-matrix"

import "./profile-songs-tab.css"

function getViewFromParams(params: URLSearchParams): "list" | "matrix" {
  const v = params.get("songsView")
  return v === "list" || v === "matrix" ? v : "list"
}

function getSortFromParams(params: URLSearchParams): UserMatrixSortMode {
  const s = params.get("songsSort")
  if (
    s === "alphabetical" ||
    s === "chronological" ||
    s === "playcount"
  ) {
    return s
  }
  return "chronological"
}

export interface ProfileSongsTabContentProps {
  userId: string | null
  isOwnProfile: boolean
}

export function ProfileSongsTabContent({
  userId,
  isOwnProfile,
}: ProfileSongsTabContentProps) {
  const searchParams = useSearchParams()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetSongName, setSheetSongName] = useState<string | null>(null)
  const [sheetSongDisplayName, setSheetSongDisplayName] = useState<
    string | null
  >(null)
  const [sheetSongId, setSheetSongId] = useState<string | null>(null)

  const [viewMode, setViewMode] = useState<"list" | "matrix">(() =>
    getViewFromParams(searchParams)
  )
  const [matrixSortMode, setMatrixSortMode] = useState<UserMatrixSortMode>(() =>
    getSortFromParams(searchParams)
  )

  useEffect(() => {
    const urlView = getViewFromParams(searchParams)
    const urlSort = getSortFromParams(searchParams)
    if (urlView !== viewMode) setViewMode(urlView)
    if (urlSort !== matrixSortMode) setMatrixSortMode(urlSort)
  }, [searchParams])

  const { shows, isLoading: showsLoading, loadingProgress: showsProgress } =
    useUserShows(userId)
  const {
    categories,
    songs,
    userSongStats,
    loading: songsLoading,
    loadingProgress: songsProgress,
  } = useUserSongsData(userId)
  const {
    songMatrix,
    sortedSongs,
    yearGroups,
    yearIdMap,
    songSpreadData,
    isLoading: matrixLoading,
    errorMessage: matrixError,
  } = useUserSongMatrix(shows, matrixSortMode)

  const attendedShowIds = useMemo(
    () => shows.map((s) => s.show_id),
    [shows]
  )
  const songIdMap = useMemo(() => {
    const map: Record<string, string> = {}
    songs.forEach((s) => {
      map[s.song] = s.song_id
    })
    return map
  }, [songs])
  const songDisplayNameMap = useMemo(() => {
    const map: Record<string, string | null> = {}
    songs.forEach((s) => {
      map[s.song] = s.song_displayname ?? null
    })
    return map
  }, [songs])

  const handleSongClick = (
    songName: string,
    songDisplayName?: string | null,
    songId?: string
  ) => {
    setSheetSongName(songName)
    setSheetSongDisplayName(
      songDisplayName ?? songDisplayNameMap[songName] ?? null
    )
    setSheetSongId(songId ?? songIdMap[songName] ?? null)
    setSheetOpen(true)
  }

  const rootClass =
    "wl-home-v2-profile-songs-tab wl-home-v2-profile-songs--root"

  if (!userId) {
    return (
      <div className={rootClass}>
        <p className="wl-profile-songs-message">
          {isOwnProfile
            ? "Please log in to see your song stats."
            : "No user selected."}
        </p>
      </div>
    )
  }

  if (showsLoading) {
    return (
      <div className={rootClass}>
        <WlWidgetPanelLoading
          message="Loading attended shows…"
          progress={showsProgress}
        />
      </div>
    )
  }

  if (shows.length === 0) {
    return (
      <div className={rootClass}>
        <p className="wl-profile-songs-message">
          {isOwnProfile
            ? "You haven't attended any shows yet. Add shows to your attendance to see song stats here."
            : "This user hasn't attended any shows yet."}
        </p>
      </div>
    )
  }

  const mainContentLoading =
    viewMode === "list" ? songsLoading : matrixLoading
  const combinedProgress =
    viewMode === "list"
      ? Math.round((showsProgress + songsProgress) / 2)
      : Math.round((showsProgress + (matrixLoading ? 50 : 100)) / 2)

  if (mainContentLoading) {
    return (
      <div className={rootClass}>
        <WlWidgetPanelLoading
          message={
            viewMode === "list"
              ? "Loading song stats…"
              : "Loading song matrix…"
          }
          progress={combinedProgress}
        />
      </div>
    )
  }

  if (viewMode === "matrix" && matrixError) {
    return (
      <div className={rootClass}>
        <p className="wl-profile-songs-message">{matrixError}</p>
      </div>
    )
  }

  const hasSongData =
    viewMode === "list"
      ? songs.length > 0 || categories.length > 0
      : songMatrix.songs.length > 0

  if (!hasSongData) {
    return (
      <div className={rootClass}>
        <p className="wl-profile-songs-message">
          {isOwnProfile
            ? "You've attended shows but no song data is available yet."
            : "This user has attended shows but no song data is available yet."}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className={rootClass}>
        <div className="wl-home-v2-profile-songs-tab__section">
          <div className="wl-home-v2-profile-songs-tab__grid">
            <div className="wl-home-v2-profile-songs-tab__main">
              <UserSongsCombined
                viewMode={viewMode}
                setViewMode={setViewMode}
                matrixSortMode={matrixSortMode}
                setMatrixSortMode={setMatrixSortMode}
                categories={categories}
                songs={songs}
                userSongStats={userSongStats}
                songMatrix={songMatrix}
                sortedSongs={sortedSongs}
                yearGroups={yearGroups}
                yearIdMap={yearIdMap}
                shows={shows}
                onSongClick={handleSongClick}
              />
            </div>
            <div className="wl-home-v2-profile-songs-tab__sidebar">
              {songSpreadData.length > 0 ?
                <UserSongSpread songSpreadData={songSpreadData} />
              : null}
            </div>
          </div>
        </div>
      </div>

      <UserSongPerformancesSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        songName={sheetSongName}
        songDisplayName={sheetSongDisplayName}
        songId={sheetSongId}
        userId={userId}
        attendedShowIds={attendedShowIds}
        isOwnProfile={isOwnProfile}
      />
    </>
  )
}
