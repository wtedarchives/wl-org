"use client"

import Link from "next/link"

import { type EchoNextShow } from "@/hooks/use-echo-next-show"
import { getEchoLiveShowUrl } from "@/lib/echo-archive-url"
import { echoTourSurfaceBgStyle } from "@/lib/echo-tour-surface-bg"
import { cn } from "@/lib/utils"
import { EchoTourStandingsCard } from "./echo-tour-standings"

function picksActionLabel(show: EchoNextShow | null): string | null {
  if (!show) return null
  if (show.picksOpen) {
    return show.submissionId ? "Edit your picks" : "Make your picks"
  }
  return "See setlist updates"
}

export function EchoTourCountdown({
  loading,
  show,
  onScoring,
}: {
  loading: boolean
  show: EchoNextShow | null
  onScoring: () => void
}) {
  const dateLong = show?.dateLong || "\u00a0"
  const venue = show?.venue || "\u00a0"
  const city = show?.city || "\u00a0"
  const countdown = loading ? "\u00a0" : show?.countdown ?? "—"
  const players = loading ? "\u00a0" : show ? String(show.players) : "—"
  const picksLabel = picksActionLabel(show)

  return (
    <div className="echo-tour-countdown">
      <div className="echo-tour-next" style={echoTourSurfaceBgStyle("next-show")}>
        <div className="echo-tour-next-inner">
          <div className="echo-tour-kicker">Next show</div>
          {loading || show ?
            <>
              <div className="echo-tour-next-date">{dateLong}</div>
              <div className="echo-tour-next-venue">{venue}</div>
              <div className="echo-tour-next-city">{city}</div>
              <div className="echo-tour-next-stats">
                <div>
                  <div className="echo-tour-kicker">Time left to pick</div>
                  <div
                    className={cn(
                      "echo-tour-stat-value is-accent",
                      show && !show.picksOpen && "is-closed",
                    )}
                  >
                    {countdown}
                  </div>
                </div>
                <div className="echo-tour-next-stats-end">
                  <div className="echo-tour-kicker">Players</div>
                  <div className="echo-tour-stat-value">{players}</div>
                </div>
              </div>
              <div className="echo-tour-next-actions">
                {picksLabel && show ?
                  <Link
                    href={getEchoLiveShowUrl(show.showId)}
                    className="echo-tour-btn-primary"
                    scroll={false}
                  >
                    {picksLabel}
                  </Link>
                : null}
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
            </>
          : <p className="echo-tour-next-empty">
              All shows on this tour have been scored.
            </p>}
        </div>
      </div>

      <div className="echo-tour-side">
        <EchoTourStandingsCard />
      </div>
    </div>
  )
}
