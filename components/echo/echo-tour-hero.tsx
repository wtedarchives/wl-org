"use client"

import { useEchoTourSummary } from "@/hooks/use-echo-tour-summary"
import { echoTourSurfaceBgStyle } from "@/lib/echo-tour-surface-bg"
import {
  ECHO_ACTIVE_LEAGUE,
  ECHO_TOUR_LEG,
  ECHO_TOUR_TITLE,
} from "./echo-tour-data"

export function EchoTourHero({
  league = ECHO_ACTIVE_LEAGUE,
  title,
}: {
  league?: string
  /** Full title override (e.g. past tour name). Defaults to active tour title + leg. */
  title?: string
}) {
  const { summary } = useEchoTourSummary(league)

  return (
    <div className="echo-tour-hero" style={echoTourSurfaceBgStyle("hero")}>
      <div className="echo-tour-hero-copy">
        <h1 className="echo-tour-hero-title">
          {title ?? (
            <>
              {ECHO_TOUR_TITLE}{" "}
              <span className="echo-tour-hero-leg">{ECHO_TOUR_LEG}</span>
            </>
          )}
        </h1>
        <div className="echo-tour-hero-summary">{summary ?? "\u00a0"}</div>
      </div>
    </div>
  )
}
