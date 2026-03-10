"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { TourPlayerStats } from "@/hooks/use-setlist-game-tour-details"

interface TourStandingsTableProps {
  standings: TourPlayerStats[]
  currentUserId?: string
}

export function TourStandingsTable({
  standings,
  currentUserId,
}: TourStandingsTableProps) {
  if (standings.length === 0) {
    return (
      <Card className="border-border/60 bg-card/80 py-0">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-semibold">Standings</CardTitle>
        </CardHeader>
        <CardContent className="py-4 text-center">
          <p className="text-xs text-muted-foreground">
            No standings available yet for this tour.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60 bg-card/80 py-0 overflow-hidden">
      <CardHeader className="py-3 border-b border-border">
        <CardTitle className="text-sm font-semibold">Standings</CardTitle>
      </CardHeader>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent bg-muted/60">
              <TableHead className="text-center text-xs font-medium">
                Rank
              </TableHead>
              <TableHead className="text-left text-xs font-medium">
                User
              </TableHead>
              <TableHead className="text-center text-xs font-medium">
                Total Points
              </TableHead>
              <TableHead className="text-center text-xs font-medium">
                Shows Played
              </TableHead>
              <TableHead className="text-center text-xs font-medium">
                Pts/Show
              </TableHead>
              <TableHead className="text-center text-xs font-medium">
                Songs
              </TableHead>
              <TableHead className="text-center text-xs font-medium">
                Sets
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
            {standings.map((player, index) => (
              <TableRow
                key={player.userId}
                className={
                  currentUserId && player.userId === currentUserId
                    ? "bg-muted/60"
                    : "hover:bg-muted/40"
                }
              >
                <TableCell className="text-center text-xs font-medium px-2 py-0.5">
                  {index + 1}
                </TableCell>
                <TableCell className="px-2 py-0.5 text-xs font-medium">
                  {player.username}
                </TableCell>
                <TableCell className="text-center text-xs font-medium text-primary px-2 py-0.5">
                  {player.totalPoints}
                </TableCell>
                <TableCell className="text-center text-xs text-muted-foreground px-2 py-0.5">
                  {player.showsPlayed}
                </TableCell>
                <TableCell className="text-center text-xs text-muted-foreground px-2 py-0.5">
                  {player.avgPointsPerShow.toFixed(2)}
                </TableCell>
                <TableCell className="text-center text-xs text-muted-foreground px-2 py-0.5">
                  {player.songsPicked}
                </TableCell>
                <TableCell className="text-center text-xs text-muted-foreground px-2 py-0.5">
                  {player.setsPicked}
                </TableCell>
                <TableCell className="text-center text-xs text-muted-foreground px-2 py-0.5">
                  {player.showOpenersPicked}
                </TableCell>
                <TableCell className="text-center text-xs text-muted-foreground px-2 py-0.5">
                  {player.showClosersPicked}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
