"use client"

import { cn } from "@/lib/utils"
import type { EchoShowRow } from "./echo-tour-data"
import { ECHO_SHOWS } from "./echo-tour-data"

export function EchoTourShows({
  shows = ECHO_SHOWS,
  onPastTours,
}: {
  shows?: EchoShowRow[]
  onPastTours: () => void
}) {
  return (
    <div className="echo-tour-shows">
      <h2 className="echo-tour-shows-title">Shows on this leg</h2>
      <div className="echo-tour-shows-list">
        {shows.map((show) => (
          <div key={`${show.dateShort}-${show.venue}`} className="echo-tour-show-row">
            <div className="echo-tour-show-date">{show.dateShort}</div>
            <div className="echo-tour-show-venue">
              <div className="echo-tour-show-venue-name">{show.venue}</div>
              <div className="echo-tour-show-venue-detail">{show.detail}</div>
            </div>
            <div className="echo-tour-show-city">{show.city}</div>
            <div>
              <span className="echo-tour-pill" data-status={show.status}>
                {show.status}
              </span>
            </div>
            <div className="echo-tour-show-players">{show.players} in</div>
            <div
              className={cn(
                "echo-tour-show-score",
                show.myScore === "—" && "is-empty",
              )}
            >
              {show.myScore}
            </div>
          </div>
        ))}
      </div>
      <div className="echo-tour-shows-foot">
        <span>Right-hand column is your score for that show.</span>
        <button type="button" className="echo-tour-text-btn" onClick={onPastTours}>
          See past tours
        </button>
      </div>
    </div>
  )
}
