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

interface SetlistGameShowsProps {
  gameShows: GameShow[]
  loading: boolean
}

export function SetlistGameShows({ gameShows, loading }: SetlistGameShowsProps) {
  if (loading) {
    return <LoadingPageCard message="Loading show statistics…" />
  }

  return (
    <Card className="ring-0 border border-border/60 bg-card/80 py-0">
      <CardHeader className="py-2">
        <CardTitle className="text-sm">Show Statistics</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {gameShows.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-xs">
              No shows found for this tour.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60">
                <TableHead className="text-center text-xs">Date</TableHead>
                <TableHead className="text-xs">Location</TableHead>
                <TableHead className="text-center text-xs">Players</TableHead>
                <TableHead className="text-center text-xs">High Score</TableHead>
                <TableHead className="text-center text-xs">Avg Score</TableHead>
                <TableHead className="text-center text-xs">Avg +/- Picks</TableHead>
                <TableHead className="text-center text-xs">Total Songs Correct</TableHead>
                <TableHead className="text-center text-xs">Avg Songs Correct</TableHead>
                <TableHead className="text-center text-xs">Total Sets Correct</TableHead>
                <TableHead className="text-center text-xs">Avg Sets Correct</TableHead>
                <TableHead className="text-center text-xs">Opener Picks</TableHead>
                <TableHead className="text-center text-xs">Closer Picks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gameShows.map((show) => (
                <TableRow key={show.show_id} className="text-[11px]">
                  <TableCell className="px-2 py-0.5 text-center font-medium">
                    <Link
                      href={`/archive/setlistgame/${show.show_id}`}
                      className="no-underline hover:underline underline-offset-2 hover:text-foreground"
                    >
                      {formatSetlistDate(show.show_date)}
                    </Link>
                  </TableCell>
                  <TableCell className="px-2 py-0.5 text-muted-foreground">
                    {show.show_venue_location}
                  </TableCell>
                  <TableCell className="px-2 py-0.5 text-center text-muted-foreground">
                    {show.playerCount ?? ""}
                  </TableCell>
                  <TableCell className="px-2 py-0.5 text-center font-medium">
                    {show.show_scored && show.highScore != null
                      ? show.highScore
                      : ""}
                  </TableCell>
                  <TableCell className="px-2 py-0.5 text-center text-muted-foreground">
                    {show.show_scored && show.averageScore != null
                      ? show.averageScore.toFixed(2)
                      : ""}
                  </TableCell>
                  <TableCell
                    className={`px-2 py-0.5 text-center ${
                      show.show_scored && show.averageOverUnder != null
                        ? getOverUnderTextColor(
                            show.averageOverUnder,
                            show.show_scored
                          )
                        : "text-muted-foreground"
                    }`}
                  >
                    {formatOverUnderValue(
                      show.averageOverUnder,
                      show.show_scored ?? false
                    )}
                  </TableCell>
                  <TableCell className="px-2 py-0.5 text-center text-muted-foreground">
                    {show.show_scored && show.totalCorrectSongs != null
                      ? show.totalCorrectSongs
                      : ""}
                  </TableCell>
                  <TableCell className="px-2 py-0.5 text-center text-muted-foreground">
                    {show.show_scored && show.averageCorrectSongs != null
                      ? show.averageCorrectSongs.toFixed(2)
                      : ""}
                  </TableCell>
                  <TableCell className="px-2 py-0.5 text-center text-muted-foreground">
                    {show.show_scored && show.totalCorrectSets != null
                      ? show.totalCorrectSets
                      : ""}
                  </TableCell>
                  <TableCell className="px-2 py-0.5 text-center text-muted-foreground">
                    {show.show_scored && show.averageCorrectSets != null
                      ? show.averageCorrectSets.toFixed(2)
                      : ""}
                  </TableCell>
                  <TableCell className="px-2 py-0.5 text-center text-muted-foreground">
                    {show.show_scored && show.usersPickedOpener != null
                      ? show.usersPickedOpener
                      : ""}
                  </TableCell>
                  <TableCell className="px-2 py-0.5 text-center text-muted-foreground">
                    {show.show_scored && show.usersPickedCloser != null
                      ? show.usersPickedCloser
                      : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
