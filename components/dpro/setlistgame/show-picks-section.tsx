"use client"

import {
  useWlHomeV2LoginAction,
} from "@/components/wl-home-v2/wl-home-v2-open-login-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { GameShow } from "@/hooks/use-setlist-game-show-data"
import type { WysteriaSession } from "@/lib/jwt"
import {
  SetlistGameWlV2Panel,
  useSetlistGameWlV2Chrome,
} from "@/components/dpro/setlistgame/setlist-game-wl-v2-chrome"

interface ShowPicksSectionProps {
  show: GameShow
  user: WysteriaSession | null
  userSubmission: string | null
  onMakePicks: () => void
}

export function ShowPicksSection({
  show,
  user,
  userSubmission,
  onMakePicks,
}: ShowPicksSectionProps) {
  const wlV2 = useSetlistGameWlV2Chrome()
  const openLogin = useWlHomeV2LoginAction()

  const inner = (
    <div
      className={
        wlV2 ? "px-1 py-3 text-center text-sm text-white/85" : "py-4 text-center"
      }
    >
      {show.isSelectionClosed ?
        <>
          <p
            className={cn(
              "mb-1 font-medium",
              wlV2 ? "text-white/90" : "text-foreground",
            )}
          >
            Picks are closed for this show.
          </p>
          <p className={wlV2 ? "text-xs text-white/60" : "text-xs text-muted-foreground"}>
            Check back later to see results after the setlist has been scored.
          </p>
        </>
      : <>
          <p
            className={cn(
              "mb-2 font-medium",
              wlV2 ? "text-white/90" : "text-foreground",
            )}
          >
            Show is open for picks.
          </p>
          {user ?
            wlV2 ?
              <button type="button" className="nav-btn" onClick={onMakePicks}>
                {userSubmission ? "Edit Picks" : "Make Picks"}
              </button>
            : <Button variant="outline" size="sm" onClick={onMakePicks}>
                {userSubmission ? "Edit Picks" : "Make Picks"}
              </Button>
          : wlV2 ?
              <button
                type="button"
                className="nav-btn"
                onClick={() => openLogin()}
              >
                Login to Play
              </button>
            : <Button variant="outline" size="sm" onClick={() => openLogin()}>
                Login to Play
              </Button>}
        </>}
    </div>
  )

  if (wlV2) {
    return <SetlistGameWlV2Panel title="Make Picks">{inner}</SetlistGameWlV2Panel>
  }

  return (
    <Card className="border-border/60 bg-card/80 py-0">
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-semibold">Make Picks</CardTitle>
      </CardHeader>
      <CardContent className="py-4 text-center">{inner}</CardContent>
    </Card>
  )
}
