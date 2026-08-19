"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import type { GameShow } from "@/hooks/use-game-shows"
import {
  formatEchoLockTimeEt,
  formatEchoMdDate,
  formatEchoUsername,
  formatEchoWeekdayShort,
} from "@/lib/echo-of-a-show"
import {
  fetchEchoLastWinner,
  type EchoLastWinner,
} from "@/lib/echo-of-a-show-onboard"
import { getEchoOfAShowShowUrl } from "@/lib/echo-of-a-show-url"

export function EchoOfAShowOnboard({
  nextShow,
  lastShow,
  loggedIn,
  onHowItWorks,
  onLogin,
  onMakePicks,
}: {
  nextShow: GameShow | null
  lastShow: GameShow | null
  loggedIn: boolean
  onHowItWorks: () => void
  onLogin: () => void
  onMakePicks: () => void
}) {
  const [winner, setWinner] = useState<EchoLastWinner | null>(null)

  useEffect(() => {
    if (!lastShow) {
      setWinner(null)
      return
    }
    let cancelled = false
    void fetchEchoLastWinner(lastShow.show_id).then((row) => {
      if (!cancelled) setWinner(row)
    })
    return () => {
      cancelled = true
    }
  }, [lastShow])

  const venue =
    nextShow?.show_subvenue || nextShow?.show_subvenue_venue || "Upcoming show"
  const lockEt = nextShow ? formatEchoLockTimeEt(nextShow.show_time) : ""

  return (
    <div className="echo-onboard">
      <h1 className="echo-onboard__headline">You&apos;re one setlist away.</h1>
      <p className="echo-onboard__lede">
        Call the songs before the band plays them. Points for the song, more for
        the right set, most for the exact spot.
      </p>

      {nextShow ?
        <Link
          href={getEchoOfAShowShowUrl(nextShow.show_id)}
          className="echo-onboard__next"
        >
          <div className="echo-onboard__next-row">
            <span className="echo-onboard__next-kicker">
              Next show · picks open
            </span>
            <span className="echo-of-a-show__meta">
              {nextShow.playerCount ?? 0} in
            </span>
          </div>
          <div className="echo-onboard__next-venue">{venue}</div>
          <div className="echo-of-a-show__meta">
            {[
              [formatEchoWeekdayShort(nextShow.show_date), formatEchoMdDate(nextShow.show_date)]
                .filter(Boolean)
                .join(" "),
              nextShow.show_venue_location,
              lockEt ? `locks ${lockEt}` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </Link>
      : <section className="echo-of-a-show__panel echo-of-a-show__panel--pad">
          <p className="echo-of-a-show__empty">
            No upcoming Echo of a Show dates right now.
          </p>
        </section>}

      <div className="echo-onboard__actions">
        <button
          type="button"
          className="echo-of-a-show__cta-btn echo-of-a-show__cta-btn--lg echo-of-a-show__ghost-btn--block"
          onClick={onHowItWorks}
        >
          Show me how it works
        </button>
        {loggedIn ?
          <button
            type="button"
            className="echo-of-a-show__ghost-btn echo-of-a-show__ghost-btn--block"
            onClick={onMakePicks}
            disabled={!nextShow}
          >
            Make my first picks
          </button>
        : <button
            type="button"
            className="echo-of-a-show__ghost-btn echo-of-a-show__ghost-btn--block"
            onClick={onLogin}
          >
            Log in to play
          </button>}
      </div>

      {winner ?
        <div className="echo-onboard__winner">
          <div className="echo-of-a-show__stat-label">Last show&apos;s winner</div>
          <div className="echo-onboard__winner-row">
            <span className="echo-onboard__winner-name">
              {formatEchoUsername(winner.username)}
            </span>
            <span className="echo-onboard__winner-pts">{winner.score} pts</span>
          </div>
          <p className="echo-of-a-show__meta">
            {winner.closer ? "Called the closer. " : ""}
            {winner.players} played.
          </p>
        </div>
      : null}
    </div>
  )
}
