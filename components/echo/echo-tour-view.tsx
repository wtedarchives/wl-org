"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { useAuth } from "@/components/auth-context"
import { SetlistGameRulesDialog } from "@/components/dpro/setlistgame/setlist-game-rules-dialog"
import { useAdminStatus } from "@/hooks/use-admin-status"
import { useEchoActiveLeague } from "@/hooks/use-echo-settings"
import { useEchoNextShow } from "@/hooks/use-echo-next-show"
import { useGameShows } from "@/hooks/use-game-shows"
import {
  ECHO_ARCHIVE_PAGE_PARAM,
  getEchoArchiveUrl,
  getEchoLiveShowUrl,
  isEchoArchivePage,
  parseEchoArchivePage,
  parseEchoArchiveShowId,
  parseEchoArchiveTourId,
} from "@/lib/echo-archive-url"

import { EchoLiveShow } from "./echo-live-show"
import { EchoTourCountdown } from "./echo-tour-countdown"
import { EchoTourHero } from "./echo-tour-hero"
import { EchoTourHistory } from "./echo-tour-history"
import { EchoTourNav } from "./echo-tour-nav"
import { EchoTourPastTour } from "./echo-tour-past-tour"
import { EchoTourProfile } from "./echo-tour-profile"
import { EchoTourScoringDialog } from "./echo-tour-scoring-dialog"
import { EchoTourShowStatistics } from "./echo-tour-show-statistics"
import { EchoTourShows } from "./echo-tour-shows"
import "./echo-tour.css"

export function EchoTourView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { session } = useAuth()
  const { isAdmin } = useAdminStatus(session)
  const active = parseEchoArchivePage(
    searchParams.get(ECHO_ARCHIVE_PAGE_PARAM),
  )
  const showIdFromUrl = parseEchoArchiveShowId(searchParams)
  const tourIdFromUrl = parseEchoArchiveTourId(searchParams)
  const [showRules, setShowRules] = useState(false)
  const [showScoringModal, setShowScoringModal] = useState(false)
  const [showTimeRevision, setShowTimeRevision] = useState(0)
  const [tourDataRevision, setTourDataRevision] = useState(0)
  const [leagueRevision, setLeagueRevision] = useState(0)
  const { activeLeague } = useEchoActiveLeague(leagueRevision)
  const { loading: nextShowLoading, show: nextShow } = useEchoNextShow(
    activeLeague,
    showTimeRevision,
  )
  const { gameShows, fetchGameShows } = useGameShows(
    activeLeague,
    session,
  )

  const handleScoringComplete = () => {
    void fetchGameShows({ silent: true })
    setShowTimeRevision((n) => n + 1)
    setTourDataRevision((n) => n + 1)
  }

  useEffect(() => {
    const raw = searchParams.get(ECHO_ARCHIVE_PAGE_PARAM)
    if (!isEchoArchivePage(raw)) {
      router.replace(getEchoArchiveUrl("tour"), { scroll: false })
      return
    }
    if (raw !== "show") return

    const parsed = parseEchoArchiveShowId(searchParams)
    const canonicalId = parsed || nextShow?.showId || null
    if (!canonicalId) return

    const currentId = searchParams.get("id")?.trim() ?? ""
    const hasLegacy = Boolean(searchParams.get("show_id")?.trim())
    if (currentId === canonicalId && !hasLegacy) return

    router.replace(getEchoLiveShowUrl(canonicalId), { scroll: false })
  }, [nextShow?.showId, router, searchParams])

  return (
    <div className="echo-tour">
      <div className="echo-tour-body">
        <EchoTourNav
          active={active}
          showScoreShow={isAdmin}
          onOpenScoreShow={() => setShowScoringModal(true)}
        />
        {active === "tour" ?
          <>
            <EchoTourHero league={activeLeague} />
            <EchoTourCountdown
              loading={nextShowLoading}
              show={nextShow}
              onScoring={() => setShowRules(true)}
            />
            <EchoTourShows
              league={activeLeague}
              refreshKey={tourDataRevision}
              onShowTimeSaved={() => setShowTimeRevision((n) => n + 1)}
            />
            <EchoTourShowStatistics league={activeLeague} />
          </>
        : active === "show" ?
          <EchoLiveShow
            key={showIdFromUrl ?? "pending"}
            showId={showIdFromUrl}
            resolving={!showIdFromUrl && nextShowLoading}
          />
        : active === "profile" ?
          <EchoTourProfile />
        : active === "tours" ?
          tourIdFromUrl ?
            <EchoTourPastTour tourId={tourIdFromUrl} />
          : <EchoTourHistory />
        : null}
      </div>
      <SetlistGameRulesDialog
        open={showRules}
        onOpenChange={setShowRules}
        wlHomeV2
        echo
      />
      <EchoTourScoringDialog
        open={showScoringModal}
        onOpenChange={setShowScoringModal}
        gameShows={gameShows}
        onScoringComplete={handleScoringComplete}
        onLeagueChanged={() => setLeagueRevision((n) => n + 1)}
      />
    </div>
  )
}
