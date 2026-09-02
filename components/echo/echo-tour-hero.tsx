"use client"

import { useEchoTourSummary } from "@/hooks/use-echo-tour-summary"
import {
  ECHO_ACTIVE_LEAGUE,
  ECHO_TOUR_LEG,
  ECHO_TOUR_TITLE,
} from "./echo-tour-data"

export function EchoTourHero() {
  const { summary } = useEchoTourSummary(ECHO_ACTIVE_LEAGUE)

  return (
    <div className="echo-tour-hero">
      <div className="echo-tour-hero-copy">
        <h1 className="echo-tour-hero-title">
          {ECHO_TOUR_TITLE}{" "}
          <span className="echo-tour-hero-leg">{ECHO_TOUR_LEG}</span>
        </h1>
        <div className="echo-tour-hero-summary">{summary ?? "\u00a0"}</div>
      </div>
    </div>
  )
}
