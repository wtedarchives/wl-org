"use client"

import type { EchoShowRow } from "./echo-tour-data"
import {
  ECHO_LIVE_NOW_LINE,
  ECHO_NEXT_SHOW,
  ECHO_SHOWS,
  ECHO_TOP_TEN,
} from "./echo-tour-data"
import { EchoTourStandingsList } from "./echo-tour-countdown"

function timelineKind(show: EchoShowRow): "next" | "live" | "scored" | "open" {
  if (show.status === "Open" && show.dateShort === "08.21") return "next"
  if (show.status === "Live") return "live"
  if (show.status === "Scored") return "scored"
  return "open"
}

export function EchoTourTimeline({
  shows = ECHO_SHOWS,
  onPicks,
  onFollow,
}: {
  shows?: EchoShowRow[]
  onPicks: () => void
  onFollow: () => void
}) {
  return (
    <div className="echo-tour-timeline">
      <div className="echo-tour-timeline-main">
        {shows.map((show) => {
          const kind = timelineKind(show)
          const cityDetail = show.detail ?
            `${show.city} · ${show.detail}`
          : show.city
          return (
            <div key={`${show.dateShort}-${show.venue}`} className="echo-tour-tl-row">
              <div className="echo-tour-tl-when">
                <div className="echo-tour-tl-date">{show.dateShort}</div>
                <div className="echo-tour-tl-weekday">{show.weekday}</div>
              </div>
              <div className="echo-tour-tl-track">
                <div className="echo-tour-tl-rail">
                  <div className="echo-tour-tl-line" />
                  <div className="echo-tour-tl-dot" data-kind={kind} />
                  <div className="echo-tour-tl-line is-grow" />
                </div>
                <div className="echo-tour-tl-card-wrap">
                  <div className="echo-tour-tl-card" data-kind={kind}>
                    <div className="echo-tour-tl-card-top">
                      <div className="echo-tour-tl-card-copy">
                        <div className="echo-tour-tl-venue">{show.venue}</div>
                        <div className="echo-tour-tl-city">{cityDetail}</div>
                      </div>
                      <span className="echo-tour-pill" data-status={show.status}>
                        {show.status}
                      </span>
                    </div>
                    {kind === "next" ?
                      <div className="echo-tour-tl-next">
                        <div>
                          <div className="echo-tour-kicker">Picks close in</div>
                          <div className="echo-tour-tl-countdown">
                            {ECHO_NEXT_SHOW.countdown}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="echo-tour-btn-primary"
                          onClick={onPicks}
                        >
                          Make your picks
                        </button>
                      </div>
                    : null}
                    {kind === "live" ?
                      <div className="echo-tour-tl-live">
                        <span className="echo-tour-tl-live-line">
                          {ECHO_LIVE_NOW_LINE}
                        </span>
                        <button
                          type="button"
                          className="echo-tour-btn-sage-sm"
                          onClick={onFollow}
                        >
                          Follow along
                        </button>
                      </div>
                    : null}
                    {kind === "scored" ?
                      <div className="echo-tour-tl-result">
                        <span>{show.players} players</span>
                        <span className="echo-tour-tl-score">
                          You scored {show.myScore}
                        </span>
                      </div>
                    : null}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="echo-tour-timeline-side">
        <div className="echo-tour-card">
          <div className="echo-tour-kicker">Tour standings</div>
          <EchoTourStandingsList rows={ECHO_TOP_TEN} />
        </div>
      </div>
    </div>
  )
}
