"use client"

import { Trophy } from "lucide-react"
import { useSetlistGameWlV2Chrome } from "@/components/dpro/setlistgame/setlist-game-wl-v2-chrome"

interface TourHeaderProps {
  tourName?: string
  totalShows: number
  totalPlayers: number
  tourWinners: { username: string; score: number }[]
}

export function TourHeader({
  tourName,
  totalShows,
  totalPlayers,
  tourWinners,
}: TourHeaderProps) {
  const wlV2 = useSetlistGameWlV2Chrome()

  if (wlV2) {
    const champions =
      tourWinners.length > 0 ?
        <div className="setlist-game-tour-header__champs-grid">
          <div className="setlist-game-tour-header__champions-inner">
            <span className="show-detail-pill inline-flex max-w-full shrink-0 items-center gap-1">
              <Trophy className="size-3.5 shrink-0 opacity-90" aria-hidden />
              <span className="font-medium">
                Champion{tourWinners.length > 1 ? "s" : ""}
              </span>
            </span>
            {tourWinners.map((w, idx) => (
              <span
                key={`${w.username}-${idx}`}
                className="setlist-game-tour-header__winner-pill"
              >
                {w.username}
                {idx < tourWinners.length - 1 ? "," : ""}
              </span>
            ))}
          </div>
        </div>
      : null

    return (
      <div className="show-header setlist-game-tour-header">
        <div className="left setlist-game-tour-header__left">
          <div className="show-header-title-row setlist-game-tour-header__title-grid">
            <h1 className="show-header-heading">
              <span className="date">{tourName ?? "Tour"}</span>
            </h1>
          </div>
          <div className="venue setlist-game-tour-header__stats-grid">
            <span className="venue-location">
              {totalShows} {totalShows === 1 ? "show" : "shows"}
              <span aria-hidden="true"> · </span>
              {totalPlayers} {totalPlayers === 1 ? "player" : "players"}
            </span>
          </div>
          {champions}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-3 py-2">
        <h2 className="text-sm font-medium">{tourName ?? "Tour"}</h2>
      </div>
      <div className="grid grid-cols-1 items-center gap-3 px-3 py-3 md:grid-cols-2">
        <div className="flex gap-4 justify-center md:justify-start">
          <div>
            <span className="text-xs text-muted-foreground">Shows: </span>
            <span className="text-xs font-medium">{totalShows}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Players: </span>
            <span className="text-xs font-medium">{totalPlayers}</span>
          </div>
        </div>
        <div className="flex min-h-0 items-center justify-center md:justify-end">
          {tourWinners.length > 0 ?
            <div className="flex flex-wrap items-center justify-center gap-1 md:justify-end">
              <Trophy className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                <span className="font-medium">
                  Tour Champion{tourWinners.length > 1 ? "s" : ""}:
                </span>{" "}
                {tourWinners.map((w, idx) => (
                  <span
                    key={idx}
                    className="ml-1 rounded border border-amber-500/60 bg-amber-500/20 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-200"
                  >
                    {w.username}
                    {idx < tourWinners.length - 1 ? ", " : ""}
                  </span>
                ))}
              </span>
            </div>
          : null}
        </div>
      </div>
    </div>
  )
}
