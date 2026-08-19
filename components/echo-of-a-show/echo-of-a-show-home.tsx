"use client"

import { useEffect, useMemo, useState } from "react"

import { useAuth } from "@/components/auth-context"
import { SongSelectionDialog } from "@/components/dpro/setlistgame/song-selection-dialog"
import { EchoOfAShowScoreDialog } from "@/components/echo-of-a-show/echo-of-a-show-score-dialog"
import { EchoOfAShowHowItWorks } from "@/components/echo-of-a-show/echo-of-a-show-how-it-works"
import { EchoOfAShowJoined } from "@/components/echo-of-a-show/echo-of-a-show-joined"
import { EchoOfAShowOnboard } from "@/components/echo-of-a-show/echo-of-a-show-onboard"
import { EchoOfAShowPicksDialog } from "@/components/echo-of-a-show/echo-of-a-show-picks-dialog"
import { EchoOfAShowRail } from "@/components/echo-of-a-show/echo-of-a-show-rail"
import { EchoOfAShowRulesDialog } from "@/components/echo-of-a-show/echo-of-a-show-rules-dialog"
import { EchoOfAShowRunning } from "@/components/echo-of-a-show/echo-of-a-show-running"
import { EchoOfAShowShell } from "@/components/echo-of-a-show/echo-of-a-show-shell"
import { EchoOfAShowUpNext } from "@/components/echo-of-a-show/echo-of-a-show-up-next"
import {
  useWlHomeV2LoginAction,
  useWlHomeV2SignupAction,
} from "@/components/wl-home-v2/wl-home-v2-open-login-context"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { useAdminStatus } from "@/hooks/use-admin-status"
import {
  useEchoLiveBoard,
  useEchoRunningShow,
} from "@/hooks/use-echo-live-board"
import { useGameShows, type GameShow } from "@/hooks/use-game-shows"
import { useSetlistScoring } from "@/hooks/use-setlist-scoring"
import { useStandingsData } from "@/hooks/use-standings-data"
import { useUserPicks, type UserPick } from "@/hooks/use-user-picks"
import { ECHO_ACTIVE_LEAGUE } from "@/lib/echo-of-a-show"
import { supabase } from "@/lib/supabase"

export function EchoOfAShowHome() {
  const { session } = useAuth()
  const openLogin = useWlHomeV2LoginAction()
  const openSignup = useWlHomeV2SignupAction()
  const { isAdmin } = useAdminStatus(session)
  const { loading, gameShows, fetchGameShows } = useGameShows(
    ECHO_ACTIVE_LEAGUE,
    session,
  )
  const { standings, loading: standingsLoading } = useStandingsData(
    ECHO_ACTIVE_LEAGUE,
    "totalPoints",
    "desc",
  )
  const { isScoring, recalcShow } = useSetlistScoring()
  const runningShow = useEchoRunningShow(gameShows)
  const { board: runningBoard, refresh: refreshRunning } = useEchoLiveBoard(
    runningShow?.show_id,
    session?.profileId,
  )
  const { userPicks, fetchUserPicks, resetPicks, setUserPicks } = useUserPicks()

  const [tourId, setTourId] = useState<string | null>(null)
  const [showRules, setShowRules] = useState(false)
  const [showHow, setShowHow] = useState(false)
  const [showScoring, setShowScoring] = useState(false)
  const [activeShow, setActiveShow] = useState<GameShow | null>(null)
  const [viewMode, setViewMode] = useState(false)
  const [justJoined, setJustJoined] = useState<{
    show: GameShow
    picks: UserPick[]
    entryOf: number
  } | null>(null)

  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    void supabase
      .from("tours")
      .select("tour_id")
      .eq("tour", ECHO_ACTIVE_LEAGUE)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setTourId(data?.tour_id ?? null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const remaining = useMemo(
    () =>
      [...gameShows]
        .filter((show) => !show.show_scored)
        .sort(
          (a, b) =>
            Number(a.show_canonid) - Number(b.show_canonid) ||
            a.show_date.localeCompare(b.show_date),
        ),
    [gameShows],
  )

  const upNext = useMemo(
    () => remaining.find((show) => !show.isSelectionClosed) ?? null,
    [remaining],
  )

  const lastShow = useMemo(() => {
    if (!session) return null
    return (
      [...gameShows]
        .filter((show) => show.show_scored && show.score != null)
        .sort(
          (a, b) =>
            Number(b.show_canonid) - Number(a.show_canonid) ||
            b.show_date.localeCompare(a.show_date),
        )[0] ?? null
    )
  }, [gameShows, session])

  const latestScored = useMemo(
    () =>
      [...gameShows]
        .filter((show) => show.show_scored)
        .sort(
          (a, b) =>
            Number(b.show_canonid) - Number(a.show_canonid) ||
            b.show_date.localeCompare(a.show_date),
        )[0] ?? null,
    [gameShows],
  )

  const hasPlayed = Boolean(
    session && gameShows.some((show) => show.submission_id),
  )
  const showOnboard = !justJoined && !hasPlayed

  const startFirstPicks = () => {
    if (!upNext) return
    if (!session) {
      openLogin()
      return
    }
    void openPicks(upNext)
  }

  const openPicks = async (show: GameShow) => {
    if (!session) {
      openLogin()
      return
    }
    setViewMode(Boolean(show.isSelectionClosed || show.show_scored))
    if (show.submission_id) {
      const picks = await fetchUserPicks(show.show_id, session)
      setUserPicks(picks)
    } else {
      resetPicks()
    }
    setActiveShow(show)
  }

  const closePicks = () => {
    setActiveShow(null)
    resetPicks()
    setViewMode(false)
  }

  if (loading || standingsLoading) {
    return <WlHomeV2PageLoading message="Loading Echo of a Show…" />
  }

  return (
    <EchoOfAShowShell
      session={session}
      onHowToPlay={() => setShowRules(true)}
      onScoreShow={() => setShowScoring(true)}
      showScoreShow={isAdmin}
      onLogin={openLogin}
      onSignup={openSignup}
    >
      <div
        className={
          justJoined || showOnboard
            ? "echo-of-a-show__home echo-of-a-show__home--onboard"
            : "echo-of-a-show__home"
        }
      >
        {justJoined ?
          <EchoOfAShowJoined
            showId={justJoined.show.show_id}
            showTime={justJoined.show.show_time}
            picks={justJoined.picks}
            entryOf={justJoined.entryOf}
          />
        : showOnboard ?
          <EchoOfAShowOnboard
            nextShow={upNext}
            lastShow={latestScored}
            loggedIn={Boolean(session)}
            onHowItWorks={() => setShowHow(true)}
            onLogin={openLogin}
            onMakePicks={startFirstPicks}
          />
        : <>
            <div className="echo-of-a-show__col">
              {runningShow ?
                <EchoOfAShowRunning
                  show={runningShow}
                  actual={runningBoard.actual}
                  picks={runningBoard.picks}
                  youScore={runningBoard.youScore}
                  scores={runningBoard.scores}
                  userId={session?.profileId}
                  onRecalc={
                    isAdmin
                      ? () => {
                          void recalcShow(runningShow.show_id).then(() =>
                            refreshRunning(),
                          )
                        }
                      : undefined
                  }
                  recalcPending={isScoring}
                />
              : null}
              {upNext ?
                <EchoOfAShowUpNext
                  show={upNext}
                  onMakePicks={() => void openPicks(upNext)}
                />
              : !runningShow ?
                <section className="echo-of-a-show__panel echo-of-a-show__panel--pad">
                  <div className="echo-of-a-show__kicker">This leg</div>
                  <p className="echo-of-a-show__empty">
                    No upcoming Echo of a Show dates right now.
                  </p>
                </section>
              : null}
            </div>
            <EchoOfAShowRail
              standings={standings}
              userId={session?.profileId}
              lastShow={lastShow}
              remaining={remaining}
              league={ECHO_ACTIVE_LEAGUE}
              tourId={tourId}
            />
          </>}
      </div>

      {activeShow && viewMode ?
        <SongSelectionDialog
          open
          onOpenChange={(open) => !open && closePicks()}
          show={activeShow}
          existingPicks={userPicks}
          isEditing={false}
          viewMode
          onSuccess={fetchGameShows}
        />
      : activeShow ?
        <EchoOfAShowPicksDialog
          open
          onOpenChange={(open) => !open && closePicks()}
          show={activeShow}
          existingPicks={userPicks}
          isEditing={Boolean(activeShow.submission_id)}
          showStarter={!hasPlayed}
          onSubmitted={(picks) => {
            if (!hasPlayed) {
              setJustJoined({
                show: activeShow,
                picks,
                entryOf: (activeShow.playerCount ?? 0) + 1,
              })
            }
          }}
          onSuccess={fetchGameShows}
        />
      : null}

      <EchoOfAShowScoreDialog
        open={showScoring}
        onOpenChange={setShowScoring}
        gameShows={gameShows}
        onRefresh={fetchGameShows}
      />

      <EchoOfAShowHowItWorks
        open={showHow}
        onOpenChange={setShowHow}
        onMakePicks={() => {
          setShowHow(false)
          startFirstPicks()
        }}
        onFullRules={() => {
          setShowHow(false)
          setShowRules(true)
        }}
      />

      <EchoOfAShowRulesDialog
        open={showRules}
        onOpenChange={setShowRules}
        onPlayNext={upNext ? () => void openPicks(upNext) : undefined}
      />
    </EchoOfAShowShell>
  )
}
