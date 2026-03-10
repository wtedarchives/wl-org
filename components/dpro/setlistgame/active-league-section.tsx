"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { GameShow } from "@/hooks/use-game-shows"
import { SetlistGameShowTable } from "./setlist-game-show-table"

interface ActiveLeagueSectionProps {
  activeLeague: string
  gameShows: GameShow[]
  user: { id: string } | null
  onSelectSongs: (show: GameShow) => void
  onViewSubmission: (show: GameShow) => void
}

export function ActiveLeagueSection({
  activeLeague,
  gameShows,
  user,
  onSelectSongs,
  onViewSubmission,
}: ActiveLeagueSectionProps) {
  return (
    <Card className="ring-0 border border-border/60 bg-card/80 py-0">
      <CardHeader className="py-2 flex flex-row items-center gap-2">
        <CardTitle className="text-sm">Active League</CardTitle>
        <span className="text-[10px] font-medium bg-muted px-1.5 py-0.5 rounded border border-border">
          {activeLeague}
        </span>
      </CardHeader>
      <CardContent className="p-0 pt-0">
        <SetlistGameShowTable
          gameShows={gameShows}
          user={user}
          onSelectSongs={onSelectSongs}
          onViewSubmission={onViewSubmission}
        />
      </CardContent>
    </Card>
  )
}
