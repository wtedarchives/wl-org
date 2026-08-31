"use client"

import { cn } from "@/lib/utils"
import type { EchoHubLayout } from "./echo-tour-data"
import {
  ECHO_TOUR_LEG,
  ECHO_TOUR_SUMMARY,
  ECHO_TOUR_TITLE,
} from "./echo-tour-data"

export function EchoTourHero({
  layout,
  onLayout,
}: {
  layout: EchoHubLayout
  onLayout: (layout: EchoHubLayout) => void
}) {
  return (
    <div className="echo-tour-hero">
      <div className="echo-tour-hero-copy">
        <h1 className="echo-tour-hero-title">
          {ECHO_TOUR_TITLE}{" "}
          <span className="echo-tour-hero-leg">{ECHO_TOUR_LEG}</span>
        </h1>
        <div className="echo-tour-hero-summary">{ECHO_TOUR_SUMMARY}</div>
      </div>
      <div className="echo-tour-seg" role="tablist" aria-label="Tour layout">
        <button
          type="button"
          role="tab"
          aria-selected={layout === "countdown"}
          className={cn("echo-tour-seg-btn", layout === "countdown" && "is-active")}
          onClick={() => onLayout("countdown")}
        >
          Countdown
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={layout === "timeline"}
          className={cn("echo-tour-seg-btn", layout === "timeline" && "is-active")}
          onClick={() => onLayout("timeline")}
        >
          Timeline
        </button>
      </div>
    </div>
  )
}
