"use client"

import { Trophy } from "lucide-react"

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
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-3 py-2">
        <h2 className="text-sm font-medium">
          {tourName ?? "Tour"}
        </h2>
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
          {tourWinners.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap justify-center md:justify-end">
              <Trophy className="size-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">
                <span className="font-medium">
                  Tour Champion{tourWinners.length > 1 ? "s" : ""}:
                </span>{" "}
                {tourWinners.map((w, idx) => (
                  <span
                    key={idx}
                    className="font-medium bg-amber-500/20 border-amber-500/60 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded border ml-1"
                  >
                    {w.username}
                    {idx < tourWinners.length - 1 ? ", " : ""}
                  </span>
                ))}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
