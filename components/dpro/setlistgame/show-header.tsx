"use client"

import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatSetlistGameDate } from "@/lib/setlist-game-utils"
import type { GameShow } from "@/hooks/use-setlist-game-show-data"
import type { WysteriaSession } from "@/lib/jwt"
import { useSetlistGameWlV2Chrome } from "@/components/dpro/setlistgame/setlist-game-wl-v2-chrome"

interface ShowHeaderProps {
  show: GameShow
  totalPlayers: number
  userSubmission: string | null
  user: WysteriaSession | null
  onViewSubmission: () => void
}

export function ShowHeader({
  show,
  totalPlayers,
  userSubmission,
  user,
  onViewSubmission,
}: ShowHeaderProps) {
  const wlV2 = useSetlistGameWlV2Chrome()

  const stackSubvenueLocation = Boolean(
    show.show_subvenue && show.show_venue_location,
  )

  if (wlV2) {
    return (
      <div className="show-header setlist-game-show-header">
        <div className="left">
          <div className="show-header-title-row">
            <h1 className="show-header-heading">
              <span className="date">{formatSetlistGameDate(show.show_date)}</span>
            </h1>
          </div>
          {show.show_subvenue || show.show_venue_location ?
            <div
              className={cn(
                "venue",
                stackSubvenueLocation && "venue--stack-subvenue-location",
              )}
            >
              {show.show_subvenue ?
                <span className="venue-subvenue-text">{show.show_subvenue}</span>
              : null}
              {show.show_venue_location ?
                stackSubvenueLocation || !show.show_subvenue ?
                  <span className="venue-location">{show.show_venue_location}</span>
                : <>
                    <span className="city" aria-hidden="true">
                      ·
                    </span>
                    <span className="venue-location">
                      {show.show_venue_location}
                    </span>
                  </>
              : null}
            </div>
          : null}
          {show.show_detail ?
            <div className="show-header-detail">
              <span className="show-detail-pill">{show.show_detail}</span>
            </div>
          : null}
        </div>
        <div className="show-header-nav">
          <div className="show-header-nav-tour-block">
            <div
              className={cn(
                "meta show-header-nav-tour",
                show.show_tour && "items-center",
              )}
            >
              <Users className="size-3.5 shrink-0 opacity-80" aria-hidden />
              <span className="meta-tour">
                {totalPlayers}{" "}
                {totalPlayers === 1 ? "user" : "users"} playing
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              {show.show_scored ?
                <span className="show-detail-pill bg-blue-600/90 text-white border border-white/10">
                  Game Completed
                </span>
              : show.isSelectionClosed ?
                <span className="show-detail-pill bg-red-600/90 text-white border border-white/10">
                  Picks Closed
                </span>
              : <span className="show-detail-pill bg-emerald-600/90 text-white border border-white/10">
                  {show.timeRemaining} left to submit
                </span>}
              {user && userSubmission ?
                <div className="nav-btns setlist-game-show-header-nav-btns">
                  <button
                    type="button"
                    className="nav-btn"
                    onClick={onViewSubmission}
                  >
                    {show.show_scored ? "View My Results" : "View My Picks"}
                  </button>
                </div>
              : null}
            </div>
          </div>
        </div>
      </div>
    )
  }

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
          {show.show_detail ?
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
              {show.show_detail}
            </p>
          : null}
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
            {show.show_scored ?
              <Badge
                variant="secondary"
                className="border-0 bg-blue-600/90 text-white"
              >
                Game Completed
              </Badge>
            : show.isSelectionClosed ?
              <Badge
                variant="secondary"
                className="border-0 bg-destructive/90 text-white"
              >
                Picks Closed
              </Badge>
            : <Badge
                variant="secondary"
                className="border-0 bg-green-600/90 text-white"
              >
                {show.timeRemaining} left to submit
              </Badge>}
          </div>
          {user && userSubmission ?
            <Button
              variant="outline"
              size="sm"
              onClick={onViewSubmission}
              className="mt-1"
            >
              {show.show_scored ? "View My Results" : "View My Picks"}
            </Button>
          : null}
        </div>
      </div>
    </div>
  )
}
