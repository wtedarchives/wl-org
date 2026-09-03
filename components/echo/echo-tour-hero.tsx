"use client"

import { useEchoTourSummary } from "@/hooks/use-echo-tour-summary"
import { echoTourSurfaceBgStyle } from "@/lib/echo-tour-surface-bg"
import { ECHO_ACTIVE_LEAGUE } from "./echo-tour-data"

/** Splits "2026 Summer [Second Leg]" → { main: "2026 Summer", leg: "[Second Leg]" } */
function splitLeagueTitle(league: string): { main: string; leg: string | null } {
  const match = league.match(/^(.*?)(\s*\[.*\])\s*$/)
  if (match) return { main: match[1].trim(), leg: match[2].trim() }
  return { main: league, leg: null }
}

export function EchoTourHero({
  league = ECHO_ACTIVE_LEAGUE,
  title,
}: {
  league?: string
  /** Full title override (e.g. past tour name). Defaults to active tour title + leg. */
  title?: string
}) {
  const { summary } = useEchoTourSummary(league)
  const { main, leg } = splitLeagueTitle(league)

  return (
    <div className="echo-tour-hero" style={echoTourSurfaceBgStyle("hero")}>
      <div className="echo-tour-hero-copy">
        <h1 className="echo-tour-hero-title">
          {title ?? (
            <>
              {main}
              {leg ? (
                <>{" "}<span className="echo-tour-hero-leg">{leg}</span></>
              ) : null}
            </>
          )}
        </h1>
        <div className="echo-tour-hero-summary">{summary ?? "\u00a0"}</div>
      </div>
    </div>
  )
}
