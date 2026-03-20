"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { UserSongsCombined } from "@/components/dpro/profile/user-songs-combined"
import { UserSongSpread } from "@/components/dpro/profile/user-song-spread"
import { useUserShows } from "@/hooks/use-user-shows"
import { useUserSongsData } from "@/hooks/use-user-songs-data"
import { useUserSongMatrix, type UserMatrixSortMode } from "@/hooks/use-user-song-matrix"

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

export default function ProfileSongsPage() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const isOwnProfile = true
  const searchParams = useSearchParams()

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

  if (!userId) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">
            Please log in to see your song stats.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (showsLoading) {
    return (
      <LoadingPageCard
        message="Loading attended shows…"
        progress={showsProgress}
      />
    )
  }

  if (shows.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">
            {isOwnProfile
              ? "You haven't attended any shows yet. Add shows to your attendance to see song stats here."
              : "This user hasn't attended any shows yet."}
          </p>
        </CardContent>
      </Card>
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
      <LoadingPageCard
        message={
          viewMode === "list"
            ? "Loading song stats…"
            : "Loading song matrix…"
        }
        progress={combinedProgress}
      />
    )
  }

  if (viewMode === "matrix" && matrixError) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">{matrixError}</p>
        </CardContent>
      </Card>
    )
  }

  const hasSongData =
    viewMode === "list"
      ? songs.length > 0 || categories.length > 0
      : songMatrix.songs.length > 0

  if (!hasSongData) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">
            {isOwnProfile
              ? "You've attended shows but no song data is available yet."
              : "This user has attended shows but no song data is available yet."}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4 xl:items-start">
        <div className="xl:col-span-3">
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
          />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-1">
          {songSpreadData.length > 0 && (
            <UserSongSpread songSpreadData={songSpreadData} />
          )}
        </div>
      </div>
    </div>
  )
}
