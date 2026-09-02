"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { SetlistGameRulesDialog } from "@/components/dpro/setlistgame/setlist-game-rules-dialog"
import { useEchoNextShow } from "@/hooks/use-echo-next-show"
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
import { ECHO_ACTIVE_LEAGUE } from "./echo-tour-data"
import { EchoTourHero } from "./echo-tour-hero"
import { EchoTourHistory } from "./echo-tour-history"
import { EchoTourNav } from "./echo-tour-nav"
import { EchoTourPastTour } from "./echo-tour-past-tour"
import { EchoTourProfile } from "./echo-tour-profile"
import { EchoTourShowStatistics } from "./echo-tour-show-statistics"
import { EchoTourShows } from "./echo-tour-shows"
import "./echo-tour.css"

export function EchoTourView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = parseEchoArchivePage(
    searchParams.get(ECHO_ARCHIVE_PAGE_PARAM),
  )
  const showIdFromUrl = parseEchoArchiveShowId(searchParams)
  const tourIdFromUrl = parseEchoArchiveTourId(searchParams)
  const [showRules, setShowRules] = useState(false)
  const [showTimeRevision, setShowTimeRevision] = useState(0)
  const { loading: nextShowLoading, show: nextShow } = useEchoNextShow(
    ECHO_ACTIVE_LEAGUE,
    showTimeRevision,
  )

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
        <EchoTourNav active={active} />
        {active === "tour" ?
          <>
            <EchoTourHero />
            <EchoTourCountdown
              loading={nextShowLoading}
              show={nextShow}
              onScoring={() => setShowRules(true)}
            />
            <EchoTourShows
              onShowTimeSaved={() => setShowTimeRevision((n) => n + 1)}
            />
            <EchoTourShowStatistics />
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
    </div>
  )
}
