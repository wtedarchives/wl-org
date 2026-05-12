"use client"

import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getOverUnderTextColor,
  formatOverUnderValue,
} from "@/lib/setlist-game-utils"
import { formatSetlistGameDate } from "@/lib/setlist-game-utils"
import type { TourGameShow } from "@/hooks/use-setlist-game-tour-details"
import { cn } from "@/lib/utils"
import { useSetlistGameArchiveUrlShell } from "@/components/dpro/setlistgame/setlist-game-archive-url-shell-context"
import { getSetlistGameShowArchiveUrl } from "@/lib/setlist-game-archive-url"
import {
  SetlistGameWlV2Panel,
  sgWlV2,
  useSetlistGameWlV2Chrome,
} from "@/components/dpro/setlistgame/setlist-game-wl-v2-chrome"

interface TourShowsTableProps {
  gameShows: TourGameShow[]
}

export function TourShowsTable({ gameShows }: TourShowsTableProps) {
  const urlShell = useSetlistGameArchiveUrlShell()
  const wlV2 = useSetlistGameWlV2Chrome()

  const tableMarkup = (
    <Table className={cn(wlV2 && sgWlV2.table)}>
      <TableHeader>
        <TableRow className={cn(wlV2 ? sgWlV2.headRow : "bg-muted/60 border-border")}>
          <TableHead
            className={cn("text-center font-medium", wlV2 ? sgWlV2.th : "text-xs")}
          >
            Date
          </TableHead>
          <TableHead
            className={cn("text-left font-medium", wlV2 ? sgWlV2.th : "text-xs")}
          >
            Location
          </TableHead>
          <TableHead
            className={cn("text-center font-medium", wlV2 ? sgWlV2.th : "text-xs")}
          >
            Players
          </TableHead>
          <TableHead
            className={cn("text-center font-medium", wlV2 ? sgWlV2.th : "text-xs")}
          >
            High Score
          </TableHead>
          <TableHead
            className={cn("text-center font-medium", wlV2 ? sgWlV2.th : "text-xs")}
          >
            Avg Score
          </TableHead>
          <TableHead
            className={cn("text-center font-medium", wlV2 ? sgWlV2.th : "text-xs")}
          >
            Avg +/- Picks
          </TableHead>
          <TableHead
            className={cn("text-center font-medium", wlV2 ? sgWlV2.th : "text-xs")}
          >
            Songs Correct
          </TableHead>
          <TableHead
            className={cn("text-center font-medium", wlV2 ? sgWlV2.th : "text-xs")}
          >
            Sets Correct
          </TableHead>
          <TableHead
            className={cn("text-center font-medium", wlV2 ? sgWlV2.th : "text-xs")}
          >
            Openers
          </TableHead>
          <TableHead
            className={cn("text-center font-medium", wlV2 ? sgWlV2.th : "text-xs")}
          >
            Closers
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {gameShows.map((show) => (
          <TableRow
            key={show.show_id}
            className={cn(
              "text-xs",
              wlV2 ? sgWlV2.bodyRow : "hover:bg-muted/40",
            )}
          >
            <TableCell
              className={cn(
                "text-center font-medium",
                wlV2 ? sgWlV2.td : "px-2 py-0.5",
              )}
            >
              <Link
                href={getSetlistGameShowArchiveUrl(show.show_id, urlShell)}
                className="no-underline hover:underline"
              >
                {formatSetlistGameDate(show.show_date)}
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
                getOverUnderTextColor(
                  show.averageOverUnder,
                  show.show_scored ?? false,
                ),
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

  const emptyBody = (
    <div className={wlV2 ? sgWlV2.emptyMsg : "py-4 text-center"}>
      <p className={wlV2 ? undefined : "text-xs text-muted-foreground"}>
        No shows found for this tour.
      </p>
    </div>
  )

  const tableBody =
    gameShows.length === 0 ?
      emptyBody
    : wlV2 ?
      <div className={sgWlV2.tableScroll}>{tableMarkup}</div>
    : tableMarkup

  if (wlV2) {
    return <SetlistGameWlV2Panel title="Shows">{tableBody}</SetlistGameWlV2Panel>
  }

  if (gameShows.length === 0) {
    return (
      <Card className="border-border/60 bg-card/80 py-0">
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Shows</CardTitle>
        </CardHeader>
        <CardContent>{emptyBody}</CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60 bg-card/80 py-0 overflow-hidden">
      <CardHeader className="py-3 border-b border-border">
        <CardTitle className="text-sm font-semibold">Shows</CardTitle>
      </CardHeader>
      <div className="overflow-x-auto">{tableMarkup}</div>
    </Card>
  )
}
