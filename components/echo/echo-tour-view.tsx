"use client"

import { useState } from "react"

import { SetlistGameRulesDialog } from "@/components/dpro/setlistgame/setlist-game-rules-dialog"
import { cn } from "@/lib/utils"

import { EchoTourCountdown } from "./echo-tour-countdown"
import { type EchoHubLayout, type EchoNavId } from "./echo-tour-data"
import { EchoTourHero } from "./echo-tour-hero"
import { EchoTourNav } from "./echo-tour-nav"
import { EchoTourShows } from "./echo-tour-shows"
import { EchoTourTimeline } from "./echo-tour-timeline"
import "./echo-tour.css"

export function EchoTourView() {
  const [hubLayout, setHubLayout] = useState<EchoHubLayout>("countdown")
  const [showRules, setShowRules] = useState(false)

  const onNavigate = (id: EchoNavId) => {
    if (id === "tour") return
  }

  return (
    <div className="echo-tour">
      <div className="echo-tour-body">
        <EchoTourNav active="tour" onNavigate={onNavigate} />
        <EchoTourHero layout={hubLayout} onLayout={setHubLayout} />
        <div className="echo-tour-layouts">
          <div
            className={cn(
              "echo-tour-layout",
              hubLayout === "countdown" && "is-active",
            )}
          >
            <EchoTourCountdown
              onPicks={() => {}}
              onScoring={() => setShowRules(true)}
            />
            <EchoTourShows onPastTours={() => {}} />
          </div>
          <div
            className={cn(
              "echo-tour-layout",
              hubLayout === "timeline" && "is-active",
            )}
          >
            <EchoTourTimeline onPicks={() => {}} onFollow={() => {}} />
          </div>
        </div>
      </div>
      <SetlistGameRulesDialog
        open={showRules}
        onOpenChange={setShowRules}
        wlHomeV2
      />
    </div>
  )
}
