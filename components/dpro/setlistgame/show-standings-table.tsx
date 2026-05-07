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
import { Check, X } from "lucide-react"
import type { PlayerStats } from "@/hooks/use-setlist-game-show-data"
import type { WysteriaSession } from "@/lib/jwt"

interface ShowStandingsTableProps {
  standings: PlayerStats[]
  user: WysteriaSession | null
  onViewOtherUserSubmission: (userId: string, username: string) => void
}

export function ShowStandingsTable({
  standings,
  user,
  onViewOtherUserSubmission,
}: ShowStandingsTableProps) {
  if (standings.length === 0) {
    return (
      <Card className="border-border/60 bg-card/80 py-0">
        <CardHeader className="py-3 bg-muted">
          <CardTitle className="text-sm">Standings</CardTitle>
        </CardHeader>
        <CardContent className="py-4 text-center">
          <p className="text-xs text-muted-foreground">
            No standings available yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60 bg-card/80 py-0 overflow-hidden">
      <CardHeader className="py-3 border-b border-border bg-muted">
        <CardTitle className="text-sm">Standings</CardTitle>
      </CardHeader>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
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
                Songs Picked
              </TableHead>
              <TableHead className="text-center text-xs font-medium">
                Sets Picked
              </TableHead>
              <TableHead className="text-center text-xs font-medium">
                Show Opener
              </TableHead>
              <TableHead className="text-center text-xs font-medium">
                Show Closer
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {standings.map((player, index) => (
              <TableRow
                key={player.userId}
                className={
                  user && player.userId === user.profileId
                    ? "bg-muted/60"
                    : "hover:bg-muted/40"
                }
              >
                <TableCell className="text-center text-xs font-medium px-2 py-0.5">
                  {index + 1}
                </TableCell>
                <TableCell className="px-2 py-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      onViewOtherUserSubmission(player.userId, player.username)
                    }
                    className="text-left text-xs font-medium no-underline hover:underline focus:outline-none"
                  >
                    {player.username}
                  </button>
                </TableCell>
                <TableCell className="text-center text-xs font-medium text-primary px-2 py-0.5">
                  {player.totalPoints}
                </TableCell>
                <TableCell className="text-center text-xs text-muted-foreground px-2 py-0.5">
                  {player.songsPicked}
                </TableCell>
                <TableCell className="text-center text-xs text-muted-foreground px-2 py-0.5">
                  {player.setsPicked}
                </TableCell>
                <TableCell className="text-center px-2 py-0.5">
                  {player.showOpenerPicked ? (
                    <Check className="size-3.5 text-green-600 mx-auto" />
                  ) : (
                    <X className="size-3.5 text-destructive mx-auto" />
                  )}
                </TableCell>
                <TableCell className="text-center px-2 py-0.5">
                  {player.showCloserPicked ? (
                    <Check className="size-3.5 text-green-600 mx-auto" />
                  ) : (
                    <X className="size-3.5 text-destructive mx-auto" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
