"use client"

import Link from "next/link"

import type { TourGameShow } from "@/hooks/use-setlist-game-tour-details"
import { formatEchoDotDate, getEchoLockCountdown } from "@/lib/echo-of-a-show"
import { getEchoOfAShowShowUrl } from "@/lib/echo-of-a-show-url"

function showPhase(show: TourGameShow): "open" | "closed" | "scored" {
  if (show.show_scored) return "scored"
  if (getEchoLockCountdown(show.show_time).isClosed) return "closed"
  return "open"
}

export function EchoOfAShowSeasonShows({
  gameShows,
}: {
  gameShows: TourGameShow[]
}) {
  if (gameShows.length === 0) {
    return (
      <p className="echo-of-a-show__empty echo-of-a-show__empty--inset">
        No shows in this season yet.
      </p>
    )
  }

  return (
    <ul className="echo-season__shows">
      {gameShows.map((show) => {
        const phase = showPhase(show)
        const statusMod =
          phase === "scored"
            ? "echo-of-a-show__status--done"
            : phase === "closed"
              ? "echo-of-a-show__status--closed"
              : "echo-of-a-show__status--open"
        const statusLabel =
          phase === "scored"
            ? "Game completed"
            : phase === "closed"
              ? "Picks closed"
              : "Picks open"
        return (
          <li key={show.show_id}>
            <Link
              href={getEchoOfAShowShowUrl(show.show_id)}
              className="echo-season__show-row"
            >
              <span className="echo-season__show-date">
                {formatEchoDotDate(show.show_date)}
              </span>
              <span className="echo-season__show-place">
                {show.show_venue_location || show.show_subvenue || "Show"}
              </span>
              <span className="echo-season__show-players">
                {show.playerCount ?? 0}
                <span>players</span>
              </span>
              <span className={`echo-of-a-show__status ${statusMod}`}>
                {statusLabel}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
