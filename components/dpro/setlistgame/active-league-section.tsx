"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { GameShow } from "@/hooks/use-game-shows"
import {
  SetlistGameWlV2Panel,
  useSetlistGameWlV2Chrome,
} from "@/components/dpro/setlistgame/setlist-game-wl-v2-chrome"
import { SetlistGameShowTable } from "./setlist-game-show-table"
import type { WysteriaSession } from "@/lib/jwt"

interface ActiveLeagueSectionProps {
  activeLeague: string
  gameShows: GameShow[]
  user: WysteriaSession | null
  onSelectSongs: (show: GameShow) => void
  onViewSubmission: (show: GameShow) => void
  isAdminUser?: boolean
  onShowTimeSaved?: () => void | Promise<void>
}

export function ActiveLeagueSection({
  activeLeague,
  gameShows,
  user,
  onSelectSongs,
  onViewSubmission,
  isAdminUser = false,
  onShowTimeSaved,
}: ActiveLeagueSectionProps) {
  const wlV2 = useSetlistGameWlV2Chrome()

  const table = (
    <SetlistGameShowTable
      embeddedInWlPanel={wlV2}
      gameShows={gameShows}
      user={user}
      onSelectSongs={onSelectSongs}
      onViewSubmission={onViewSubmission}
      isAdminUser={isAdminUser}
      onShowTimeSaved={onShowTimeSaved}
    />
  )

  if (wlV2) {
    return (
      <SetlistGameWlV2Panel
        title="Active League"
        titleRight={
          <span className="text-[10px] font-medium text-white/55">
            {activeLeague}
          </span>
        }
      >
        {table}
      </SetlistGameWlV2Panel>
    )
  }

  return (
    <Card className="ring-0 border border-border/60 bg-card/80 py-0">
      <CardHeader className="py-2 flex flex-row items-center gap-2">
        <CardTitle className="text-sm">Active League</CardTitle>
        <span className="text-[10px] font-medium bg-muted px-1.5 py-0.5 rounded border border-border">
          {activeLeague}
        </span>
      </CardHeader>
      <CardContent className="p-0 pt-0">{table}</CardContent>
    </Card>
  )
}
