"use client"

import type { GameShow } from "@/hooks/use-setlist-game-show-data"
import {
  formatEchoHeroDate,
  formatEchoShowTimeEt,
} from "@/lib/echo-of-a-show"

export function EchoOfAShowShowHero({
  show,
  timeRemaining,
}: {
  show: GameShow
  timeRemaining: string
}) {
  const venue = show.show_subvenue || show.show_subvenue_venue || "Show"
  const status = show.show_scored
    ? "Game Completed"
    : show.isSelectionClosed
      ? "Picks Closed"
      : timeRemaining
        ? `${timeRemaining} left to submit`
        : "Picks open"
  const statusMod = show.show_scored
    ? "echo-of-a-show__status--done"
    : show.isSelectionClosed
      ? "echo-of-a-show__status--closed"
      : "echo-of-a-show__status--open"

  return (
    <section className="echo-of-a-show__hero">
      <span className={`echo-of-a-show__status ${statusMod}`}>{status}</span>
      <div className="echo-of-a-show__hero-date">{formatEchoHeroDate(show.show_date)}</div>
      <div className="echo-of-a-show__hero-venue">{venue}</div>
      <div className="echo-of-a-show__hero-meta">
        {[
          show.show_venue_location,
          formatEchoShowTimeEt(show.show_time)
            ? `${formatEchoShowTimeEt(show.show_time)} ET`
            : null,
          show.show_tour,
        ]
          .filter(Boolean)
          .join(" · ")}
      </div>
    </section>
  )
}
