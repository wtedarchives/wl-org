"use client"

import type { GameShow } from "@/hooks/use-game-shows"
import { EchoOfAShowCountdown } from "@/components/echo-of-a-show/echo-of-a-show-countdown"
import {
  formatEchoHomeDate,
  formatEchoShowTimeEt,
} from "@/lib/echo-of-a-show"

export function EchoOfAShowUpNext({
  show,
  onMakePicks,
}: {
  show: GameShow
  onMakePicks: () => void
}) {
  const open = !show.isSelectionClosed && !show.show_scored
  const venue = show.show_subvenue || show.show_subvenue_venue || "Upcoming show"
  const timeEt = formatEchoShowTimeEt(show.show_time)
  const pickLabel =
    show.submission_id && open
      ? "Edit picks"
      : show.submission_id
        ? "View picks"
        : "Make picks"
  const showPickAction = open || Boolean(show.submission_id)

  return (
    <section className="echo-of-a-show__panel echo-of-a-show__panel--pad">
      <div className="echo-of-a-show__kicker-row">
        <span
          className={
            open
              ? "echo-of-a-show__kicker echo-of-a-show__kicker--mint"
              : "echo-of-a-show__kicker"
          }
        >
          {open ? "Up next · picks open" : "Up next · picks closed"}
        </span>
        <span className="echo-of-a-show__meta">
          {show.playerCount ?? 0} {show.playerCount === 1 ? "entry" : "entries"}
        </span>
      </div>
      <div className="echo-of-a-show__up-next-row">
        <div>
          <div className="echo-of-a-show__venue">{venue}</div>
          <div className="echo-of-a-show__meta echo-of-a-show__venue-meta">
            {[
              formatEchoHomeDate(show.show_date),
              show.show_venue_location,
              timeEt,
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
        <div className="echo-of-a-show__lock-cluster">
          {open ?
            <>
              <span className="echo-of-a-show__stat-label">Locks in</span>
              <EchoOfAShowCountdown showTime={show.show_time} />
            </>
          : null}
          {showPickAction ?
            <button
              type="button"
              className="echo-of-a-show__cta-btn echo-of-a-show__cta-btn--lg"
              onClick={onMakePicks}
            >
              {pickLabel}
            </button>
          : null}
        </div>
      </div>
    </section>
  )
}
