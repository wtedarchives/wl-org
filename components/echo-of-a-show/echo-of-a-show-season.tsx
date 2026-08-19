"use client"

import { useState } from "react"
import Link from "next/link"

import { useAuth } from "@/components/auth-context"
import { EchoOfAShowRulesDialog } from "@/components/echo-of-a-show/echo-of-a-show-rules-dialog"
import { EchoOfAShowSeasonNumbers } from "@/components/echo-of-a-show/echo-of-a-show-season-numbers"
import { EchoOfAShowSeasonShows } from "@/components/echo-of-a-show/echo-of-a-show-season-shows"
import { EchoOfAShowSeasonStandings } from "@/components/echo-of-a-show/echo-of-a-show-season-standings"
import { EchoOfAShowShell } from "@/components/echo-of-a-show/echo-of-a-show-shell"
import {
  useWlHomeV2LoginAction,
  useWlHomeV2SignupAction,
} from "@/components/wl-home-v2/wl-home-v2-open-login-context"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { usePastTours } from "@/hooks/use-past-tours"
import { useSetlistGameTourDetails } from "@/hooks/use-setlist-game-tour-details"
import {
  formatEchoOrdinal,
  formatEchoSeasonShortTitle,
} from "@/lib/echo-of-a-show"
import { getEchoOfAShowTourUrl } from "@/lib/echo-of-a-show-url"

type SeasonTab = "standings" | "shows" | "numbers"

const TABS: { id: SeasonTab; label: string }[] = [
  { id: "standings", label: "Standings" },
  { id: "shows", label: "Shows" },
  { id: "numbers", label: "Numbers" },
]

export function EchoOfAShowSeason({ tourId }: { tourId: string }) {
  const { session } = useAuth()
  const openLogin = useWlHomeV2LoginAction()
  const openSignup = useWlHomeV2SignupAction()
  const { loading, tourInfo, gameShows, standings, tourStats } =
    useSetlistGameTourDetails(tourId)
  const [showRules, setShowRules] = useState(false)
  const [tab, setTab] = useState<SeasonTab>("standings")

  if (loading) {
    return <WlHomeV2PageLoading message="Loading season…" />
  }

  if (!tourInfo) {
    return (
      <EchoOfAShowShell
        session={session}
        crumbLabel="Season"
        onHowToPlay={() => setShowRules(true)}
        onLogin={openLogin}
        onSignup={openSignup}
      >
        <p className="echo-of-a-show__empty">Season not found.</p>
        <EchoOfAShowRulesDialog open={showRules} onOpenChange={setShowRules} />
      </EchoOfAShowShell>
    )
  }

  const youIndex = session
    ? standings.findIndex((row) => row.userId === session.profileId)
    : -1
  const youRow = youIndex >= 0 ? standings[youIndex] : null
  const playerCount = tourStats.totalPlayers || standings.length
  const showCount = tourStats.totalShows || gameShows.length
  const shortTitle = formatEchoSeasonShortTitle(tourInfo.tour)

  return (
    <EchoOfAShowShell
      session={session}
      crumbLabel={tourInfo.tour}
      onHowToPlay={() => setShowRules(true)}
      onLogin={openLogin}
      onSignup={openSignup}
    >
      <div className="echo-season">
        <header className="echo-season__head">
          <div className="echo-season__titles">
            <h1 className="echo-season__title echo-season__title--full">
              {tourInfo.tour}
            </h1>
            <h1 className="echo-season__title echo-season__title--short">
              {shortTitle}
            </h1>
            <p className="echo-season__count">
              {playerCount} {playerCount === 1 ? "player" : "players"} ·{" "}
              {showCount} {showCount === 1 ? "show" : "shows"}
            </p>
          </div>
          <div className="echo-season__tabs" role="tablist" aria-label="Season">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className={
                  tab === item.id
                    ? "echo-season__tab echo-season__tab--on"
                    : "echo-season__tab"
                }
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>

        {tab === "standings" && youRow ?
          <section className="echo-season__you" aria-label="Your season">
            <div>
              <div className="echo-of-a-show__stat-label">You</div>
              <div className="echo-season__you-value">
                {formatEchoOrdinal(youIndex + 1)}
                <span>of {playerCount}</span>
              </div>
            </div>
            <div>
              <div className="echo-of-a-show__stat-label">Points</div>
              <div className="echo-season__you-value">
                {youRow.totalPoints.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="echo-of-a-show__stat-label">Shows</div>
              <div className="echo-season__you-value">{youRow.showsPlayed}</div>
            </div>
          </section>
        : null}

        {tab === "standings" || tab === "shows" ?
          <section className="echo-of-a-show__panel">
            {tab === "standings" ?
              <EchoOfAShowSeasonStandings
                standings={standings}
                userId={session?.profileId}
              />
            : <EchoOfAShowSeasonShows gameShows={gameShows} />}
          </section>
        : <EchoOfAShowSeasonNumbers gameShows={gameShows} />}

        <EchoSeasonPast league={tourInfo.tour} />
      </div>
      <EchoOfAShowRulesDialog open={showRules} onOpenChange={setShowRules} />
    </EchoOfAShowShell>
  )
}

function EchoSeasonPast({ league }: { league: string }) {
  const { pastTours, loading } = usePastTours(league)

  if (loading || pastTours.length === 0) return null

  return (
    <section className="echo-season__past">
      <h2 className="echo-of-a-show__stat-label">Other seasons</h2>
      <ul>
        {pastTours.map((tour) => (
          <li key={tour.tour_id}>
            <Link
              href={getEchoOfAShowTourUrl(tour.tour_id)}
              className="echo-season__past-row"
            >
              <span className="echo-season__past-name">{tour.tour}</span>
              <span className="echo-season__count">
                {tour.playerCount} players · {tour.showCount} shows
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
