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
import { getSetlistGameShowArchiveUrl } from "@/lib/setlist-game-archive-url"

interface TourShowsTableProps {
  gameShows: TourGameShow[]
}

export function TourShowsTable({ gameShows }: TourShowsTableProps) {
  if (gameShows.length === 0) {
    return (
      <Card className="border-border/60 bg-card/80 py-0">
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Shows</CardTitle>
        </CardHeader>
        <CardContent className="py-4 text-center">
          <p className="text-xs text-muted-foreground">
            No shows found for this tour.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60 bg-card/80 py-0 overflow-hidden">
      <CardHeader className="py-3 border-b border-border">
        <CardTitle className="text-sm font-semibold">Shows</CardTitle>
      </CardHeader>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent bg-muted/60">
              <TableHead className="text-center text-xs font-medium">
                Date
              </TableHead>
              <TableHead className="text-left text-xs font-medium">
                Location
              </TableHead>
              <TableHead className="text-center text-xs font-medium">
                Players
              </TableHead>
              <TableHead className="text-center text-xs font-medium">
                High Score
              </TableHead>
              <TableHead className="text-center text-xs font-medium">
                Avg Score
              </TableHead>
              <TableHead className="text-center text-xs font-medium">
                Avg +/- Picks
              </TableHead>
              <TableHead className="text-center text-xs font-medium">
                Songs Correct
              </TableHead>
              <TableHead className="text-center text-xs font-medium">
                Sets Correct
              </TableHead>
              <TableHead className="text-center text-xs font-medium">
                Openers
              </TableHead>
              <TableHead className="text-center text-xs font-medium">
                Closers
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gameShows.map((show) => (
              <TableRow
                key={show.show_id}
                className="hover:bg-muted/40 text-xs"
              >
                <TableCell className="text-center font-medium px-2 py-0.5">
                  <Link
                    href={getSetlistGameShowArchiveUrl(show.show_id)}
                    className="no-underline hover:underline"
                  >
                    {formatSetlistGameDate(show.show_date)}
                  </Link>
                </TableCell>
                <TableCell className="px-2 py-0.5 text-muted-foreground">
                  {show.show_venue_location}
                </TableCell>
                <TableCell className="text-center px-2 py-0.5 text-muted-foreground">
                  {show.playerCount ?? "-"}
                </TableCell>
                <TableCell className="text-center px-2 py-0.5 font-medium">
                  {show.show_scored && show.highScore != null
                    ? show.highScore
                    : "-"}
                </TableCell>
                <TableCell className="text-center px-2 py-0.5 text-muted-foreground">
                  {show.show_scored && show.averageScore != null
                    ? show.averageScore.toFixed(2)
                    : "-"}
                </TableCell>
                <TableCell
                  className={`text-center px-2 py-0.5 ${getOverUnderTextColor(
                    show.averageOverUnder,
                    show.show_scored ?? false
                  )}`}
                >
                  {formatOverUnderValue(
                    show.averageOverUnder,
                    show.show_scored ?? false
                  )}
                </TableCell>
                <TableCell className="text-center px-2 py-0.5 text-muted-foreground">
                  {show.show_scored && show.totalCorrectSongs != null
                    ? show.totalCorrectSongs
                    : "-"}
                </TableCell>
                <TableCell className="text-center px-2 py-0.5 text-muted-foreground">
                  {show.show_scored && show.totalCorrectSets != null
                    ? show.totalCorrectSets
                    : "-"}
                </TableCell>
                <TableCell className="text-center px-2 py-0.5 text-muted-foreground">
                  {show.show_scored && show.usersPickedOpener != null
                    ? show.usersPickedOpener
                    : "-"}
                </TableCell>
                <TableCell className="text-center px-2 py-0.5 text-muted-foreground">
                  {show.show_scored && show.usersPickedCloser != null
                    ? show.usersPickedCloser
                    : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
