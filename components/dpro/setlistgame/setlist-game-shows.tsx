"use client"

import Link from "next/link"
import { formatSetlistDate } from "@/lib/setlist-utils"
import {
  getOverUnderTextColor,
  formatOverUnderValue,
} from "@/lib/setlist-game-utils"
import type { GameShow } from "@/hooks/use-game-shows"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { cn } from "@/lib/utils"
import { useSetlistGameArchiveUrlShell } from "@/components/dpro/setlistgame/setlist-game-archive-url-shell-context"
import { getSetlistGameShowArchiveUrl } from "@/lib/setlist-game-archive-url"
import {
  SetlistGameWlV2Panel,
  sgWlV2,
  useSetlistGameWlV2Chrome,
} from "@/components/dpro/setlistgame/setlist-game-wl-v2-chrome"

interface SetlistGameShowsProps {
  gameShows: GameShow[]
  loading: boolean
}

export function SetlistGameShows({ gameShows, loading }: SetlistGameShowsProps) {
  const urlShell = useSetlistGameArchiveUrlShell()
  const wlV2 = useSetlistGameWlV2Chrome()

  if (loading) {
    return wlV2 ?
        <WlHomeV2PageLoading message="Loading show statistics…" />
      : <LoadingPageCard message="Loading show statistics…" />
  }

  const tableMarkup = (
    <Table className={cn(wlV2 && sgWlV2.table)}>
      <TableHeader>
        <TableRow className={cn(wlV2 ? sgWlV2.headRow : "bg-muted/60")}>
          <TableHead className={cn("text-center text-xs", wlV2 && sgWlV2.th)}>
            Date
          </TableHead>
          <TableHead className={cn("text-xs", wlV2 && sgWlV2.th)}>
            Location
          </TableHead>
          <TableHead className={cn("text-center text-xs", wlV2 && sgWlV2.th)}>
            Players
          </TableHead>
          <TableHead className={cn("text-center text-xs", wlV2 && sgWlV2.th)}>
            High Score
          </TableHead>
          <TableHead className={cn("text-center text-xs", wlV2 && sgWlV2.th)}>
            Avg Score
          </TableHead>
          <TableHead className={cn("text-center text-xs", wlV2 && sgWlV2.th)}>
            Avg +/- Picks
          </TableHead>
          <TableHead className={cn("text-center text-xs", wlV2 && sgWlV2.th)}>
            Total Songs Correct
          </TableHead>
          <TableHead className={cn("text-center text-xs", wlV2 && sgWlV2.th)}>
            Avg Songs Correct
          </TableHead>
          <TableHead className={cn("text-center text-xs", wlV2 && sgWlV2.th)}>
            Total Sets Correct
          </TableHead>
          <TableHead className={cn("text-center text-xs", wlV2 && sgWlV2.th)}>
            Avg Sets Correct
          </TableHead>
          <TableHead className={cn("text-center text-xs", wlV2 && sgWlV2.th)}>
            Opener Picks
          </TableHead>
          <TableHead className={cn("text-center text-xs", wlV2 && sgWlV2.th)}>
            Closer Picks
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {gameShows.map((show) => (
          <TableRow
            key={show.show_id}
            className={cn("text-[11px]", wlV2 && sgWlV2.bodyRow)}
          >
            <TableCell
              className={cn(
                "text-center font-medium",
                wlV2 ? sgWlV2.td : "px-2 py-0.5",
              )}
            >
              <Link
                href={getSetlistGameShowArchiveUrl(show.show_id, urlShell)}
                className="no-underline hover:underline hover:text-foreground"
              >
                {formatSetlistDate(show.show_date)}
              </Link>
            </TableCell>
            <TableCell
              className={cn(
                wlV2 ? cn(sgWlV2.td, "text-white/65") : "px-2 py-0.5 text-muted-foreground",
              )}
            >
              {show.show_venue_location}
            </TableCell>
            <TableCell
              className={cn(
                "text-center",
                wlV2 ? cn(sgWlV2.td, "text-white/65") : "px-2 py-0.5 text-muted-foreground",
              )}
            >
              {show.playerCount ?? ""}
            </TableCell>
            <TableCell
              className={cn(
                "text-center font-medium",
                wlV2 ? sgWlV2.td : "px-2 py-0.5",
              )}
            >
              {show.show_scored && show.highScore != null ? show.highScore : ""}
            </TableCell>
            <TableCell
              className={cn(
                "text-center",
                wlV2 ? cn(sgWlV2.td, "text-white/65") : "px-2 py-0.5 text-muted-foreground",
              )}
            >
              {show.show_scored && show.averageScore != null
                ? show.averageScore.toFixed(2)
                : ""}
            </TableCell>
            <TableCell
              className={cn(
                "text-center",
                wlV2 ? sgWlV2.td : "px-2 py-0.5",
                !wlV2 &&
                  (show.show_scored && show.averageOverUnder != null
                    ? getOverUnderTextColor(
                        show.averageOverUnder,
                        show.show_scored,
                      )
                    : "text-muted-foreground"),
              )}
            >
              {formatOverUnderValue(
                show.averageOverUnder,
                show.show_scored ?? false,
              )}
            </TableCell>
            <TableCell
              className={cn(
                "text-center",
                wlV2 ? cn(sgWlV2.td, "text-white/65") : "px-2 py-0.5 text-muted-foreground",
              )}
            >
              {show.show_scored && show.totalCorrectSongs != null
                ? show.totalCorrectSongs
                : ""}
            </TableCell>
            <TableCell
              className={cn(
                "text-center",
                wlV2 ? cn(sgWlV2.td, "text-white/65") : "px-2 py-0.5 text-muted-foreground",
              )}
            >
              {show.show_scored && show.averageCorrectSongs != null
                ? show.averageCorrectSongs.toFixed(2)
                : ""}
            </TableCell>
            <TableCell
              className={cn(
                "text-center",
                wlV2 ? cn(sgWlV2.td, "text-white/65") : "px-2 py-0.5 text-muted-foreground",
              )}
            >
              {show.show_scored && show.totalCorrectSets != null
                ? show.totalCorrectSets
                : ""}
            </TableCell>
            <TableCell
              className={cn(
                "text-center",
                wlV2 ? cn(sgWlV2.td, "text-white/65") : "px-2 py-0.5 text-muted-foreground",
              )}
            >
              {show.show_scored && show.averageCorrectSets != null
                ? show.averageCorrectSets.toFixed(2)
                : ""}
            </TableCell>
            <TableCell
              className={cn(
                "text-center",
                wlV2 ? cn(sgWlV2.td, "text-white/65") : "px-2 py-0.5 text-muted-foreground",
              )}
            >
              {show.show_scored && show.usersPickedOpener != null
                ? show.usersPickedOpener
                : ""}
            </TableCell>
            <TableCell
              className={cn(
                "text-center",
                wlV2 ? cn(sgWlV2.td, "text-white/65") : "px-2 py-0.5 text-muted-foreground",
              )}
            >
              {show.show_scored && show.usersPickedCloser != null
                ? show.usersPickedCloser
                : ""}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  const tableBody =
    gameShows.length === 0 ?
      <div className={wlV2 ? sgWlV2.emptyMsg : "py-8 text-center"}>
        <p className={wlV2 ? undefined : "text-xs text-muted-foreground"}>
          No shows found for this tour.
        </p>
      </div>
    : wlV2 ?
      <div className={sgWlV2.tableScroll}>{tableMarkup}</div>
    : tableMarkup

  if (wlV2) {
    return (
      <SetlistGameWlV2Panel title="Show Statistics">{tableBody}</SetlistGameWlV2Panel>
    )
  }

  return (
    <Card className="ring-0 border border-border/60 bg-card/80 py-0">
      <CardHeader className="py-2">
        <CardTitle className="text-sm">Show Statistics</CardTitle>
      </CardHeader>
      <CardContent className="p-0">{tableBody}</CardContent>
    </Card>
  )
}
