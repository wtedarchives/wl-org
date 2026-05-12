"use client"

import { HelpCircle } from "lucide-react"

import { useSetlistGameWlV2Chrome } from "@/components/dpro/setlistgame/setlist-game-wl-v2-chrome"
import { Button } from "@/components/ui/button"

interface SetlistGameHeaderProps {
  isAdminUser: boolean
  onShowRules: () => void
  onShowScoring: () => void
}

export function SetlistGameHeader({
  isAdminUser,
  onShowRules,
  onShowScoring,
}: SetlistGameHeaderProps) {
  const wlV2 = useSetlistGameWlV2Chrome()

  if (wlV2) {
    return (
      <div className="show-header setlist-game-main-header">
        <div className="left min-w-0">
          <div className="show-header-title-row">
            <h1 className="show-header-heading">
              <span className="date">Setlist Game</span>
            </h1>
          </div>
        </div>
        <div className="show-header-nav">
          <div className="nav-btns setlist-game-main-header__nav-btns">
            {isAdminUser ?
              <button
                type="button"
                className="nav-btn border-red-400/35 text-red-100 hover:bg-red-500/15"
                onClick={onShowScoring}
              >
                Score Show
              </button>
            : null}
            <button type="button" className="nav-btn" onClick={onShowRules}>
              <HelpCircle className="size-3.5 shrink-0 opacity-90" aria-hidden />
              How to Play
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-row justify-between items-center bg-muted/60 border border-border rounded-lg px-4 py-2">
      <h1 className="text-sm font-semibold">Setlist Game</h1>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onShowRules}>
          <HelpCircle className="size-4" />
          <span>How to Play</span>
        </Button>
        {isAdminUser && (
          <Button variant="destructive" size="sm" onClick={onShowScoring}>
            Score Show
          </Button>
        )}
      </div>
    </div>
  )
}
