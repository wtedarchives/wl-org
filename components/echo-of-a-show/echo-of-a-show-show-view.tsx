"use client"

import { useCallback, useEffect, useState, type ReactNode } from "react"

import { useAuth } from "@/components/auth-context"
import { SongSelectionDialog } from "@/components/dpro/setlistgame/song-selection-dialog"
import { EchoOfAShowFieldPicks } from "@/components/echo-of-a-show/echo-of-a-show-field-picks"
import { EchoOfAShowPicksDialog } from "@/components/echo-of-a-show/echo-of-a-show-picks-dialog"
import { EchoOfAShowRulesDialog } from "@/components/echo-of-a-show/echo-of-a-show-rules-dialog"
import { EchoOfAShowShell } from "@/components/echo-of-a-show/echo-of-a-show-shell"
import { EchoOfAShowShowHero } from "@/components/echo-of-a-show/echo-of-a-show-show-hero"
import { EchoOfAShowShowRail } from "@/components/echo-of-a-show/echo-of-a-show-show-rail"
import { EchoOfAShowStandings } from "@/components/echo-of-a-show/echo-of-a-show-standings"
import {
  useWlHomeV2LoginAction,
  useWlHomeV2SignupAction,
} from "@/components/wl-home-v2/wl-home-v2-open-login-context"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import {
  useSetlistGameShowData,
  type SubmissionDetails,
} from "@/hooks/use-setlist-game-show-data"
import {
  useTopClosersData,
  useTopOpenersData,
  useTopSongsData,
} from "@/hooks/use-top-songs-data"
import type { UserPick } from "@/hooks/use-user-picks"
import { formatEchoShowCrumb } from "@/lib/echo-of-a-show"
import { supabase } from "@/lib/supabase"

const emptyDetails: SubmissionDetails = {
  totalScore: 0,
  songsPicked: 0,
  songsPlayed: 0,
  setlist: [],
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

function ShowCrowdData({
  showId,
  children,
}: {
  showId: string
  children: (data: {
    topSongs: ReturnType<typeof useTopSongsData>
    topOpeners: ReturnType<typeof useTopOpenersData>
    topClosers: ReturnType<typeof useTopClosersData>
  }) => ReactNode
}) {
  const topSongs = useTopSongsData(showId)
  const topOpeners = useTopOpenersData(showId)
  const topClosers = useTopClosersData(showId)
  return children({ topSongs, topOpeners, topClosers })
}

export function EchoOfAShowShowView({ showId }: { showId: string }) {
  const { session } = useAuth()
  const openLogin = useWlHomeV2LoginAction()
  const openSignup = useWlHomeV2SignupAction()
  const [showRules, setShowRules] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState(false)
  const [viewingUserId, setViewingUserId] = useState<string | null>(null)
  const [userPicks, setUserPicks] = useState<UserPick[]>([])
  const [dialogPicks, setDialogPicks] = useState<UserPick[]>([])
  const [ownSubmissionId, setOwnSubmissionId] = useState<string | null>(null)
  const [songsPicked, setSongsPicked] = useState(0)
  const [songsPlayed, setSongsPlayed] = useState(0)
  const [score, setScore] = useState<number | null>(null)
  const [playersCount, setPlayersCount] = useState(0)
  const [fieldEpoch, setFieldEpoch] = useState(0)
  const [submissionDetails, setSubmissionDetails] =
    useState<SubmissionDetails>(emptyDetails)

  const { loading, show, standings, totalPlayers, userSubmission } =
    useSetlistGameShowData(showId, session)

  const refreshOwnEntry = useCallback(async () => {
    if (!session || !supabase) {
      setOwnSubmissionId(null)
      setUserPicks([])
      setSongsPicked(0)
      setSongsPlayed(0)
      setScore(null)
      return
    }
    const { data: sub } = await supabase
      .from("setlist_game_submissions")
      .select("submission_id, score, total_songs_picked, total_songs_played")
      .eq("user_id", session.profileId)
      .eq("show_id", showId)
      .maybeSingle()
    if (!sub) {
      setOwnSubmissionId(null)
      setUserPicks([])
      setSongsPicked(0)
      setSongsPlayed(0)
      setScore(null)
      return
    }
    setOwnSubmissionId(sub.submission_id)
    const picks = await fetchPicksBySubmissionId(sub.submission_id)
    setUserPicks(picks)
    setScore(sub.score ?? null)
    setSongsPicked(sub.total_songs_picked ?? picks.length)
    setSongsPlayed(sub.total_songs_played ?? 0)
    const { count } = await supabase
      .from("setlist_game_submissions")
      .select("*", { count: "exact", head: true })
      .eq("show_id", showId)
    if (count != null) setPlayersCount(count)
  }, [session, showId])

  useEffect(() => {
    void refreshOwnEntry()
  }, [refreshOwnEntry, userSubmission])

  useEffect(() => {
    setPlayersCount(totalPlayers)
  }, [totalPlayers])

  const openPicksEditor = async () => {
    if (!session || !show) {
      openLogin()
      return
    }
    setViewingUserId(null)
    setViewMode(false)
    if (ownSubmissionId) {
      const picks = await fetchPicksBySubmissionId(ownSubmissionId)
      setDialogPicks(picks)
    } else {
      setDialogPicks([])
    }
    setDialogOpen(true)
  }

  const openOwnResults = async () => {
    if (!session || !show || !ownSubmissionId || !supabase) return
    setViewingUserId(null)
    const picks = await fetchPicksBySubmissionId(ownSubmissionId)
    setDialogPicks(picks)
    const { data } = await supabase
      .from("setlist_game_submissions")
      .select("score, total_songs_picked, total_songs_played")
      .eq("submission_id", ownSubmissionId)
      .single()
    setSubmissionDetails({
      totalScore: data?.score ?? 0,
      songsPicked: data?.total_songs_picked ?? picks.length,
      songsPlayed: data?.total_songs_played ?? 0,
      setlist: [],
    })
    setViewMode(true)
    setDialogOpen(true)
  }

  const openOtherResults = async (userId: string, username: string) => {
    if (!show || !supabase) return
    if (!session) {
      openLogin()
      return
    }
    const { data, error } = await supabase
      .from("setlist_game_submissions")
      .select("submission_id, score, total_songs_picked, total_songs_played")
      .eq("user_id", userId)
      .eq("show_id", showId)
      .single()
    if (error || !data) return
    const picks = await fetchPicksBySubmissionId(data.submission_id)
    setDialogPicks(picks)
    setSubmissionDetails({
      totalScore: data.score ?? 0,
      songsPicked: data.total_songs_picked ?? picks.length,
      songsPlayed: data.total_songs_played ?? 0,
      setlist: [],
      username,
    })
    setViewingUserId(userId)
    setViewMode(true)
    setDialogOpen(true)
  }

  if (loading) {
    return <WlHomeV2PageLoading message="Loading show…" />
  }

  if (!show) {
    return (
      <EchoOfAShowShell
        session={session}
        crumbLabel="Show"
        onHowToPlay={() => setShowRules(true)}
        onLogin={openLogin}
        onSignup={openSignup}
      >
        <p className="echo-of-a-show__empty">Show not found.</p>
        <EchoOfAShowRulesDialog open={showRules} onOpenChange={setShowRules} />
      </EchoOfAShowShell>
    )
  }

  const phase = show.show_scored
    ? "scored"
    : show.isSelectionClosed
      ? "closed"
      : "open"
  const youIndex = session
    ? standings.findIndex((row) => row.userId === session.profileId)
    : -1
  const youRow = youIndex >= 0 ? standings[youIndex] : null

  return (
    <EchoOfAShowShell
      session={session}
      crumbLabel={formatEchoShowCrumb(show.show_date, show.show_venue_location)}
      onHowToPlay={() => setShowRules(true)}
      onLogin={openLogin}
      onSignup={openSignup}
    >
      <ShowCrowdData key={fieldEpoch} showId={showId}>
        {({ topSongs, topOpeners, topClosers }) => (
          <div className="echo-of-a-show__show">
            <div className="echo-of-a-show__col">
              {phase === "scored" ?
                <EchoOfAShowStandings
                  standings={standings}
                  userId={session?.profileId}
                  totalPlayers={playersCount}
                  onViewUser={(id, name) => void openOtherResults(id, name)}
                />
              : <>
                  <EchoOfAShowShowHero
                    show={show}
                    timeRemaining={show.timeRemaining ?? ""}
                  />
                  <EchoOfAShowFieldPicks
                    topSongs={topSongs}
                    topOpeners={topOpeners}
                    topClosers={topClosers}
                  />
                </>}
            </div>
            <EchoOfAShowShowRail
              phase={phase}
              showTime={show.show_time}
              totalPlayers={playersCount}
              loggedIn={Boolean(session)}
              submitted={Boolean(ownSubmissionId)}
              picks={userPicks}
              songsPicked={songsPicked}
              songsPlayed={songsPlayed}
              score={score}
              youStanding={
                youRow
                  ? {
                      rank: youIndex + 1,
                      total: standings.length || playersCount,
                      songsHit: youRow.songsPicked,
                    }
                  : null
              }
              topSongs={topSongs}
              onMakePicks={() => void openPicksEditor()}
              onLogin={openLogin}
              onViewResults={() => void openOwnResults()}
            />
          </div>
        )}
      </ShowCrowdData>

      {dialogOpen && show && (viewMode || viewingUserId) ?
        <SongSelectionDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setDialogOpen(false)
              setViewMode(false)
              setViewingUserId(null)
            }
          }}
          show={{ ...show, submission_id: ownSubmissionId ?? undefined }}
          existingPicks={dialogPicks}
          isEditing={false}
          viewMode
          submissionDetails={submissionDetails}
        />
      : dialogOpen && show ?
        <EchoOfAShowPicksDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            if (!open) setDialogOpen(false)
          }}
          show={{ ...show, submission_id: ownSubmissionId ?? undefined }}
          existingPicks={dialogPicks}
          isEditing={Boolean(ownSubmissionId)}
          onSuccess={() => {
            void refreshOwnEntry()
            setFieldEpoch((n) => n + 1)
          }}
        />
      : null}

      <EchoOfAShowRulesDialog open={showRules} onOpenChange={setShowRules} />
    </EchoOfAShowShell>
  )
}
