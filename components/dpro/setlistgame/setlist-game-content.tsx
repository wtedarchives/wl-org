"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-context"
import { supabase } from "@/lib/supabase"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { useGameShows } from "@/hooks/use-game-shows"
import { useShowStatistics } from "@/hooks/use-show-statistics"
import { useAdminStatus } from "@/hooks/use-admin-status"
import { useUserPicks } from "@/hooks/use-user-picks"
import { usePastTours } from "@/hooks/use-past-tours"
import type { GameShow } from "@/hooks/use-game-shows"
import { SetlistGameHeader } from "./setlist-game-header"
import { LoginPrompt } from "./login-prompt"
import { ActiveLeagueSection } from "./active-league-section"
import { SetlistGameStandings } from "./setlist-game-standings"
import { SetlistGameShows } from "./setlist-game-shows"
import { PastTours } from "./past-tours"
import { SetlistGameRulesDialog } from "./setlist-game-rules-dialog"
import { ScoringDialog } from "./scoring-dialog"
import { SongSelectionDialog } from "./song-selection-dialog"

const ACTIVE_LEAGUE = "2026 Viva El Gonzo"

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
}

export function SetlistGameContent() {
  const { user } = useAuth()
  const [activeSongSelectionShow, setActiveSongSelectionShow] =
    useState<GameShow | null>(null)
  const [showScoringModal, setShowScoringModal] = useState(false)
  const [showRulesModal, setShowRulesModal] = useState(false)
  const [viewMode, setViewMode] = useState(false)
  const [submissionDetails, setSubmissionDetails] = useState<SubmissionDetails>({
    totalScore: 0,
    songsPicked: 0,
    songsPlayed: 0,
    setlist: [],
  })

  const { loading, gameShows, fetchGameShows } = useGameShows(
    ACTIVE_LEAGUE,
    user ?? null
  )
  const { showStatsLoading, showsWithStats } = useShowStatistics(ACTIVE_LEAGUE)
  const { isAdmin: isAdminUser, loading: adminLoading } = useAdminStatus(
    user ?? null
  )
  const { userPicks, fetchUserPicks, resetPicks, setUserPicks } = useUserPicks()
  const { loading: pastToursLoading, pastTours } = usePastTours(ACTIVE_LEAGUE)

  const handleSelectSongs = async (show: GameShow) => {
    setViewMode(false)
    if (show.submission_id && user) {
      await fetchUserPicks(show.show_id, user)
    } else {
      resetPicks()
    }
    setActiveSongSelectionShow(show)
  }

  const handleCloseModal = () => {
    setActiveSongSelectionShow(null)
    resetPicks()
    setViewMode(false)
  }

  const handleViewSubmission = async (show: GameShow) => {
    if (!user || !show.submission_id || !supabase) return

    try {
      const { data: picksData, error: picksError } = await supabase
        .from("setlist_game_picks")
        .select("song, set, setnum, placement, score, result, showcloser_correct, showopener_correct")
        .eq("submission_id", show.submission_id)

      if (picksError) {
        console.error("Error fetching picks:", picksError)
        return
      }

      setUserPicks(picksData ?? [])

      const { data: submissionData, error: submissionError } = await supabase
        .from("setlist_game_submissions")
        .select("score, total_songs_picked, total_songs_played")
        .eq("submission_id", show.submission_id)
        .single()

      if (!submissionError) {
        setSubmissionDetails({
          totalScore: submissionData?.score ?? 0,
          songsPicked: submissionData?.total_songs_picked ?? picksData?.length ?? 0,
          songsPlayed: submissionData?.total_songs_played ?? 0,
          setlist: [],
        })
      }

      setViewMode(true)
      setActiveSongSelectionShow(show)
    } catch (error) {
      console.error("Error in view submission:", error)
    }
  }

  const handleScoringComplete = () => {
    fetchGameShows()
  }

  if (loading) {
    return <LoadingPageCard message="Loading setlist game…" />
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 rounded-b-none p-4 md:rounded-b-xl md:p-6 overflow-hidden">
      <SetlistGameHeader
        isAdminUser={isAdminUser}
        onShowRules={() => setShowRulesModal(true)}
        onShowScoring={() => setShowScoringModal(true)}
      />

      {!user && <LoginPrompt />}

      <ActiveLeagueSection
        activeLeague={ACTIVE_LEAGUE}
        gameShows={gameShows}
        user={user ?? null}
        onSelectSongs={handleSelectSongs}
        onViewSubmission={handleViewSubmission}
        isAdminUser={isAdminUser && !adminLoading}
        onShowTimeSaved={() => fetchGameShows({ silent: true })}
      />

      <SetlistGameStandings activeLeague={ACTIVE_LEAGUE} user={user ?? null} />

      <SetlistGameShows gameShows={showsWithStats} loading={showStatsLoading} />

      <PastTours
        currentLeague={ACTIVE_LEAGUE}
        loading={pastToursLoading}
        pastTours={pastTours}
      />

      {activeSongSelectionShow && (
        <SongSelectionDialog
          open={!!activeSongSelectionShow}
          onOpenChange={(open) => !open && handleCloseModal()}
          show={activeSongSelectionShow}
          existingPicks={userPicks}
          isEditing={
            !!activeSongSelectionShow.submission_id && !viewMode
          }
          viewMode={viewMode}
          submissionDetails={viewMode ? submissionDetails : undefined}
          onSuccess={fetchGameShows}
        />
      )}

      <ScoringDialog
        open={showScoringModal}
        onOpenChange={setShowScoringModal}
        gameShows={gameShows}
        onScoringComplete={handleScoringComplete}
      />

      <SetlistGameRulesDialog
        open={showRulesModal}
        onOpenChange={setShowRulesModal}
      />
    </div>
  )
}
