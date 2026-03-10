"use client"

import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatSetlistGameDate } from "@/lib/setlist-game-utils"
import type { GameShow } from "@/hooks/use-setlist-game-show-data"

interface ShowHeaderProps {
  show: GameShow
  totalPlayers: number
  userSubmission: string | null
  user: { id: string } | null
  onViewSubmission: () => void
}

export function ShowHeader({
  show,
  totalPlayers,
  userSubmission,
  user,
  onViewSubmission,
}: ShowHeaderProps) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
      <div className="grid grid-cols-1 gap-3 px-3 py-3 text-center md:grid-cols-2 md:text-left">
        <div>
          <p className="text-sm font-medium text-foreground">
            {formatSetlistGameDate(show.show_date)}
          </p>
          <p className="text-xs font-medium text-muted-foreground">
            {show.show_subvenue}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {show.show_venue_location}
          </p>
          {show.show_detail && (
            <p className="text-xs font-medium text-muted-foreground mt-0.5">
              {show.show_detail}
            </p>
          )}
        </div>
        <div className="flex flex-col items-center gap-1 md:items-end">
          <div className="flex items-center gap-2">
            <Users className="size-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              <span className="font-medium">{totalPlayers}</span>{" "}
              {totalPlayers === 1 ? "user" : "users"} playing
            </span>
          </div>
          <div>
            {show.show_scored ? (
              <Badge variant="secondary" className="bg-blue-600/90 text-white border-0">
                Game Completed
              </Badge>
            ) : show.isSelectionClosed ? (
              <Badge variant="secondary" className="bg-destructive/90 text-white border-0">
                Picks Closed
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-green-600/90 text-white border-0">
                {show.timeRemaining} left to submit
              </Badge>
            )}
          </div>
          {user && userSubmission && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewSubmission}
              className="mt-1"
            >
              {show.show_scored ? "View My Results" : "View My Picks"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
