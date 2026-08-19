"use client"

import { useEffect, useMemo, useState } from "react"

import { useAuth } from "@/components/auth-context"
import { ScoringDialog } from "@/components/dpro/setlistgame/scoring-dialog"
import { SongSelectionDialog } from "@/components/dpro/setlistgame/song-selection-dialog"
import { EchoOfAShowPicksDialog } from "@/components/echo-of-a-show/echo-of-a-show-picks-dialog"
import { EchoOfAShowRail } from "@/components/echo-of-a-show/echo-of-a-show-rail"
import { EchoOfAShowRulesDialog } from "@/components/echo-of-a-show/echo-of-a-show-rules-dialog"
import { EchoOfAShowShell } from "@/components/echo-of-a-show/echo-of-a-show-shell"
import { EchoOfAShowUpNext } from "@/components/echo-of-a-show/echo-of-a-show-up-next"
import {
  useWlHomeV2LoginAction,
  useWlHomeV2SignupAction,
} from "@/components/wl-home-v2/wl-home-v2-open-login-context"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { useAdminStatus } from "@/hooks/use-admin-status"
import { useGameShows, type GameShow } from "@/hooks/use-game-shows"
import { useStandingsData } from "@/hooks/use-standings-data"
import { useUserPicks } from "@/hooks/use-user-picks"
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
  const { userPicks, fetchUserPicks, resetPicks, setUserPicks } = useUserPicks()

  const [tourId, setTourId] = useState<string | null>(null)
  const [showRules, setShowRules] = useState(false)
  const [showScoring, setShowScoring] = useState(false)
  const [activeShow, setActiveShow] = useState<GameShow | null>(null)
  const [viewMode, setViewMode] = useState(false)

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
    () => remaining.find((show) => !show.isSelectionClosed) ?? remaining[0] ?? null,
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
      <div className="echo-of-a-show__home">
        <div className="echo-of-a-show__col">
          {upNext ?
            <EchoOfAShowUpNext
              show={upNext}
              onMakePicks={() => void openPicks(upNext)}
            />
          : <section className="echo-of-a-show__panel echo-of-a-show__panel--pad">
              <div className="echo-of-a-show__kicker">This leg</div>
              <p className="echo-of-a-show__empty">
                No upcoming Echo of a Show dates right now.
              </p>
            </section>}
        </div>
        <EchoOfAShowRail
          standings={standings}
          userId={session?.profileId}
          lastShow={lastShow}
          remaining={remaining}
          league={ECHO_ACTIVE_LEAGUE}
          tourId={tourId}
        />
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
          onSuccess={fetchGameShows}
        />
      : null}

      <ScoringDialog
        open={showScoring}
        onOpenChange={setShowScoring}
        gameShows={gameShows}
        onScoringComplete={fetchGameShows}
        wlHomeV2
      />

      <EchoOfAShowRulesDialog
        open={showRules}
        onOpenChange={setShowRules}
        onPlayNext={upNext ? () => void openPicks(upNext) : undefined}
      />
    </EchoOfAShowShell>
  )
}
