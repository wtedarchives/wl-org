"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/components/auth-context"
import {
  useSetlistBreadcrumb,
} from "@/components/setlist-breadcrumb-context"
import { formatSetlistGameDate } from "@/lib/setlist-game-utils"
import { supabase } from "@/lib/supabase"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { WlHomeV2SetlistGameShell } from "@/components/wl-home-v2/wl-home-v2-setlistgame-shell"
import { useSetlistGameShowData } from "@/hooks/use-setlist-game-show-data"
import {
  useTopSongsData,
  useTopOpenersData,
  useTopClosersData,
} from "@/hooks/use-top-songs-data"
import type { GameShow } from "@/hooks/use-setlist-game-show-data"
import type { UserPick } from "@/hooks/use-user-picks"
import { ShowHeader } from "@/components/dpro/setlistgame/show-header"
import { ShowStandingsTable } from "@/components/dpro/setlistgame/show-standings-table"
import { ShowPicksSection } from "@/components/dpro/setlistgame/show-picks-section"
import { TopPicksSection } from "@/components/dpro/setlistgame/top-picks-section"
import { SongSelectionDialog } from "@/components/dpro/setlistgame/song-selection-dialog"
import { useSetlistGameArchiveUrlShell } from "@/components/dpro/setlistgame/setlist-game-archive-url-shell-context"
import { buildSetlistGameShowBreadcrumbs } from "@/components/dpro/setlistgame/setlist-game-breadcrumb-items"
import { SetlistGameWlV2ArchiveCrumbs } from "@/components/dpro/setlistgame/setlist-game-wl-v2-archive-crumbs"

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
  submissionId: string,
): Promise<UserPick[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from("setlist_game_picks")
    .select(
      "song, set, setnum, placement, score, result, showcloser_correct, showopener_correct",
    )
    .eq("submission_id", submissionId)
    .order("setnum", { ascending: true })
  return data ?? []
}

export function SetlistGameShowView({
  showId,
  variant = "default",
}: {
  showId: string
  variant?: "default" | "wlHomeV2"
}) {
  const v2 = variant === "wlHomeV2"
  const urlShell = useSetlistGameArchiveUrlShell()
  const { session } = useAuth()
  const [activeSongSelectionShow, setActiveSongSelectionShow] =
    useState<GameShow | null>(null)
  const [userPicks, setUserPicks] = useState<UserPick[]>([])
  const [viewMode, setViewMode] = useState(true)
  const [submissionDetails, setSubmissionDetails] = useState<SubmissionDetails>(
    {
      totalScore: 0,
      songsPicked: 0,
      songsPlayed: 0,
      setlist: [],
    },
  )
  const [viewingUserId, setViewingUserId] = useState<string | null>(null)

  const { setSetlistBreadcrumbs } = useSetlistBreadcrumb()
  const { loading, show, standings, totalPlayers, userSubmission } =
    useSetlistGameShowData(showId ?? undefined, session)

  const crumbItems = useMemo(
    () =>
      show ? buildSetlistGameShowBreadcrumbs(urlShell, showId, show) : null,
    [show, showId, urlShell],
  )

  const topSongs = useTopSongsData(showId ?? undefined)
  const topOpeners = useTopOpenersData(showId ?? undefined)
  const topClosers = useTopClosersData(showId ?? undefined)

  const handleMakePicks = async () => {
    if (!session || !showId || !show) return
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
    if (!session || !userSubmission || !show || !supabase) return
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
    username: string,
  ) => {
    if (!showId || !show || !supabase) return
    if (!session) {
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

  useEffect(() => {
    if (show) {
      const dateLabel = formatSetlistGameDate(show.show_date)
      const venuePart = show.show_venue_location ?? ""
      const titlePart = venuePart ? `${dateLabel} - ${venuePart}` : dateLabel
      document.title = `Setlist Game (${titlePart}) – WysteriaLane.org`
    }
    return () => {
      document.title = ""
    }
  }, [show])

  useEffect(() => {
    if (!crumbItems) {
      setSetlistBreadcrumbs(null)
      return
    }
    setSetlistBreadcrumbs(crumbItems)
    return () => setSetlistBreadcrumbs(null)
  }, [crumbItems, setSetlistBreadcrumbs])

  if (loading) {
    return v2 ?
        <WlHomeV2PageLoading message="Loading show…" />
      : <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden rounded-b-none p-4 md:rounded-b-xl md:p-6">
          <LoadingPageCard message="Loading show…" page="setlist" />
        </div>
  }

  if (!show) {
    const notFoundInner = (
      <div className="rounded-lg border border-border bg-card p-4 text-center">
        <p className="text-sm text-muted-foreground">Show not found.</p>
      </div>
    )
    return v2 ?
        <WlHomeV2SetlistGameShell>{notFoundInner}</WlHomeV2SetlistGameShell>
      : <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden rounded-b-none p-4 md:rounded-b-xl md:p-6">
          {notFoundInner}
        </div>
  }

  const main = (
    <div className={v2 ? "setlist-game-show-stack" : "space-y-4"}>
      <ShowHeader
        show={show}
        totalPlayers={totalPlayers}
        userSubmission={userSubmission}
        user={session}
        onViewSubmission={handleViewSubmission}
      />

      {show.show_scored ?
        <ShowStandingsTable
          standings={standings}
          user={session}
          onViewOtherUserSubmission={handleViewOtherUserSubmission}
        />
      : <ShowPicksSection
          show={show}
          user={session}
          userSubmission={userSubmission}
          onMakePicks={handleMakePicks}
        />}

      <TopPicksSection
        topSongs={topSongs}
        topOpeners={topOpeners}
        topClosers={topClosers}
      />
    </div>
  )

  const songDialog =
    activeSongSelectionShow ?
      <SongSelectionDialog
        open={!!activeSongSelectionShow}
        onOpenChange={(open) => !open && handleCloseModal()}
        show={activeSongSelectionShow}
        existingPicks={userPicks}
        isEditing={!!userSubmission && !viewMode && !viewingUserId}
        viewMode={viewMode || !!viewingUserId}
        submissionDetails={viewMode ? submissionDetails : undefined}
      />
    : null

  return v2 ?
      <WlHomeV2SetlistGameShell
        crumbs={
          crumbItems ?
            <SetlistGameWlV2ArchiveCrumbs items={crumbItems} />
          : null
        }
      >
        {main}
        {songDialog}
      </WlHomeV2SetlistGameShell>
    : <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden rounded-b-none p-4 md:rounded-b-xl md:p-6">
        {main}
        {songDialog}
      </div>
}
