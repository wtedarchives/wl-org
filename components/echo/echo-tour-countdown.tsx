"use client"

import { cn } from "@/lib/utils"
import type { EchoStandingRow } from "./echo-tour-data"
import {
  ECHO_NEXT_SHOW,
  ECHO_TOP_TEN,
  ECHO_YOU_THIS_TOUR,
} from "./echo-tour-data"

function StandingsList({
  rows,
  className,
}: {
  rows: EchoStandingRow[]
  className?: string
}) {
  return (
    <div className={cn("echo-tour-standings", className)}>
      {rows.map((row) => (
        <div key={row.name} className="echo-tour-standings-row">
          <span className="echo-tour-standings-rank">{row.rank}</span>
          <span
            className={cn(
              "echo-tour-standings-name",
              row.isMe && "is-me",
            )}
          >
            {row.name}
          </span>
          <span className="echo-tour-standings-pts">{row.points}</span>
        </div>
      ))}
    </div>
  )
}

export function EchoTourCountdown({
  onPicks,
  onScoring,
}: {
  onPicks: () => void
  onScoring: () => void
}) {
  return (
    <div className="echo-tour-countdown">
      <div className="echo-tour-next">
        <div className="echo-tour-next-blob" aria-hidden />
        <div className="echo-tour-next-inner">
          <div className="echo-tour-kicker">Next show you can play</div>
          <div className="echo-tour-next-date">{ECHO_NEXT_SHOW.dateLong}</div>
          <div className="echo-tour-next-venue">{ECHO_NEXT_SHOW.venue}</div>
          <div className="echo-tour-next-city">{ECHO_NEXT_SHOW.city}</div>
          <div className="echo-tour-next-stats">
            <div>
              <div className="echo-tour-kicker">Picks close in</div>
              <div className="echo-tour-stat-value is-accent">
                {ECHO_NEXT_SHOW.countdown}
              </div>
            </div>
            <div className="echo-tour-next-stats-end">
              <div className="echo-tour-kicker">In so far</div>
              <div className="echo-tour-stat-value">{ECHO_NEXT_SHOW.players}</div>
            </div>
          </div>
          <div className="echo-tour-next-actions">
            <button
              type="button"
              className="echo-tour-btn-primary"
              onClick={onPicks}
            >
              Make your picks
            </button>
            <button
              type="button"
              className="echo-tour-btn-ghost"
              onClick={onScoring}
            >
              How scoring works
            </button>
            <span className="echo-tour-next-note">
              Submissions close one hour before showtime.
            </span>
          </div>
        </div>
      </div>

      <div className="echo-tour-side">
        <div className="echo-tour-card">
          <div className="echo-tour-kicker">You, this tour</div>
          <div className="echo-tour-rank-row">
            <span className="echo-tour-rank">{ECHO_YOU_THIS_TOUR.rankLabel}</span>
            <span className="echo-tour-rank-of">{ECHO_YOU_THIS_TOUR.ofPlayers}</span>
          </div>
          <div className="echo-tour-rank-note">{ECHO_YOU_THIS_TOUR.pointsLine}</div>
          <StandingsList rows={ECHO_TOP_TEN} />
        </div>
      </div>
    </div>
  )
}

export function EchoTourStandingsList({
  rows = ECHO_TOP_TEN,
}: {
  rows?: EchoStandingRow[]
}) {
  return <StandingsList rows={rows} />
}
