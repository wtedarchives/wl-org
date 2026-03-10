"use client"

import { use, useState, useEffect } from "react"
import { notFound } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { useSetlistBreadcrumb } from "@/components/setlist-breadcrumb-context"
import { formatSetlistGameDate } from "@/lib/setlist-game-utils"
import { supabase } from "@/lib/supabase"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { useSetlistGameShowData } from "@/hooks/use-setlist-game-show-data"
import { useTopSongsData, useTopOpenersData, useTopClosersData } from "@/hooks/use-top-songs-data"
import type { GameShow } from "@/hooks/use-setlist-game-show-data"
import type { UserPick } from "@/hooks/use-user-picks"
import { ShowHeader } from "@/components/dpro/setlistgame/show-header"
import { ShowStandingsTable } from "@/components/dpro/setlistgame/show-standings-table"
import { ShowPicksSection } from "@/components/dpro/setlistgame/show-picks-section"
import { TopPicksSection } from "@/components/dpro/setlistgame/top-picks-section"
import { SongSelectionDialog } from "@/components/dpro/setlistgame/song-selection-dialog"

interface SubmissionDetails {
  totalScore: number
  songsPicked: number
  songsPlayed: number
  setlist: Array<{
    entry_song: string
    entry_set: string
    entry_setnum: number
    entry_placement: string
  }>
  username?: string
}

async function fetchPicksBySubmissionId(
  submissionId: string
): Promise<UserPick[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from("setlist_game_picks")
    .select("song, set, setnum, placement, score, result, showcloser_correct, showopener_correct")
    .eq("submission_id", submissionId)
    .order("setnum", { ascending: true })
  return data ?? []
}

export default function SetlistGameShowPage({
  params,
}: {
  params: Promise<{ show_id: string }>
}) {
  const { show_id: showId } = use(params)
  const { user } = useAuth()
  const [activeSongSelectionShow, setActiveSongSelectionShow] =
    useState<GameShow | null>(null)
  const [userPicks, setUserPicks] = useState<UserPick[]>([])
  const [viewMode, setViewMode] = useState(true)
  const [submissionDetails, setSubmissionDetails] = useState<SubmissionDetails>({
    totalScore: 0,
    songsPicked: 0,
    songsPlayed: 0,
    setlist: [],
  })
  const [viewingUserId, setViewingUserId] = useState<string | null>(null)

  const { setSetlistBreadcrumbs } = useSetlistBreadcrumb()
  const { loading, show, standings, totalPlayers, userSubmission } =
    useSetlistGameShowData(showId ?? undefined, user ?? null)
  const topSongs = useTopSongsData(showId ?? undefined)
  const topOpeners = useTopOpenersData(showId ?? undefined)
  const topClosers = useTopClosersData(showId ?? undefined)

  const handleMakePicks = async () => {
    if (!user || !showId || !show) return
    setViewMode(false)
    if (userSubmission) {
      const picks = await fetchPicksBySubmissionId(userSubmission)
      setUserPicks(picks)
      setActiveSongSelectionShow({ ...show, submission_id: userSubmission })
    } else {
      setUserPicks([])
      setActiveSongSelectionShow(show)
    }
  }

  const handleCloseModal = () => {
    setActiveSongSelectionShow(null)
    setUserPicks([])
    setViewMode(false)
    setViewingUserId(null)
  }

  const handleViewSubmission = async () => {
    if (!user || !userSubmission || !show || !supabase) return
    try {
      setViewingUserId(null)
      const picks = await fetchPicksBySubmissionId(userSubmission)
      setUserPicks(picks)
      const { data } = await supabase
        .from("setlist_game_submissions")
        .select("score, total_songs_picked, total_songs_played")
        .eq("submission_id", userSubmission)
        .single()
      setSubmissionDetails({
        totalScore: data?.score ?? 0,
        songsPicked: data?.total_songs_picked ?? 0,
        songsPlayed: data?.total_songs_played ?? 0,
        setlist: [],
      })
      setViewMode(true)
      setActiveSongSelectionShow(show)
    } catch (err) {
      console.error("Error viewing submission:", err)
    }
  }

  const handleViewOtherUserSubmission = async (
    userId: string,
    username: string
  ) => {
    if (!showId || !show || !supabase) return
    if (!user) {
      alert("Please log in to view user submissions")
      return
    }
    try {
      setViewingUserId(userId)
      const { data, error } = await supabase
        .from("setlist_game_submissions")
        .select("submission_id, score, total_songs_picked, total_songs_played")
        .eq("user_id", userId)
        .eq("show_id", showId)
        .single()
      if (error || !data) return
      const picks = await fetchPicksBySubmissionId(data.submission_id)
      setUserPicks(picks)
      setSubmissionDetails({
        totalScore: data.score ?? 0,
        songsPicked: data.total_songs_picked ?? 0,
        songsPlayed: data.total_songs_played ?? 0,
        setlist: [],
        username,
      })
      setViewMode(true)
      setActiveSongSelectionShow(show)
    } catch (err) {
      console.error("Error viewing other user submission:", err)
    }
  }

  if (!showId) notFound()

  useEffect(() => {
    if (!show) {
      setSetlistBreadcrumbs(null)
      return
    }
    const dateLabel = formatSetlistGameDate(show.show_date)
    const venuePart = show.show_venue_location
      ? ` (${show.show_venue_location})`
      : ""
    const lastLabel = `${dateLabel}${venuePart}`
    const tours = show.tours as { tour_id: string } | null | undefined
    const items = [
      { label: "Setlist Archive", href: "/dpro" },
      { label: "Setlist Game", href: "/dpro/setlistgame" },
      ...(show.show_tour && tours?.tour_id
        ? [
            {
              label: show.show_tour,
              href: `/dpro/setlistgame/tour/${tours.tour_id}`,
            },
          ]
        : []),
      { label: lastLabel, href: "" },
    ]
    setSetlistBreadcrumbs(items)
    return () => setSetlistBreadcrumbs(null)
  }, [show, setSetlistBreadcrumbs])

  if (loading) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden rounded-b-none p-4 md:rounded-b-xl md:p-6">
        <LoadingPageCard message="Loading show…" page="setlist" />
      </div>
    )
  }

  if (!show) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden rounded-b-none p-4 md:rounded-b-xl md:p-6">
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-sm text-muted-foreground">Show not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden rounded-b-none p-4 md:rounded-b-xl md:p-6">
      <div className="space-y-4">
        <ShowHeader
          show={show}
          totalPlayers={totalPlayers}
          userSubmission={userSubmission}
          user={user}
          onViewSubmission={handleViewSubmission}
        />

        {show.show_scored ? (
          <ShowStandingsTable
            standings={standings}
            user={user}
            onViewOtherUserSubmission={handleViewOtherUserSubmission}
          />
        ) : (
          <ShowPicksSection
            show={show}
            user={user}
            userSubmission={userSubmission}
            onMakePicks={handleMakePicks}
          />
        )}

        <TopPicksSection
          topSongs={topSongs}
          topOpeners={topOpeners}
          topClosers={topClosers}
        />
      </div>

      {activeSongSelectionShow && (
        <SongSelectionDialog
          open={!!activeSongSelectionShow}
          onOpenChange={(open) => !open && handleCloseModal()}
          show={activeSongSelectionShow}
          existingPicks={userPicks}
          isEditing={!!userSubmission && !viewMode && !viewingUserId}
          viewMode={viewMode || !!viewingUserId}
          submissionDetails={viewMode ? submissionDetails : undefined}
        />
      )}
    </div>
  )
}
