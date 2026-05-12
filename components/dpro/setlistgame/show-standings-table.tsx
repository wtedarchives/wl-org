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
import { cn } from "@/lib/utils"
import type { PlayerStats } from "@/hooks/use-setlist-game-show-data"
import type { WysteriaSession } from "@/lib/jwt"
import {
  SetlistGameWlV2Panel,
  sgWlV2,
  useSetlistGameWlV2Chrome,
} from "@/components/dpro/setlistgame/setlist-game-wl-v2-chrome"

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
  const wlV2 = useSetlistGameWlV2Chrome()

  const emptyBody = (
    <div className={wlV2 ? sgWlV2.emptyMsg : "py-4 text-center"}>
      <p className={wlV2 ? undefined : "text-xs text-muted-foreground"}>
        No standings available yet.
      </p>
    </div>
  )

  const tableMarkup = (
    <Table className={cn(wlV2 && sgWlV2.table)}>
      <TableHeader>
        <TableRow className={cn(wlV2 ? sgWlV2.headRow : "border-border bg-muted")}>
          <TableHead
            className={cn("text-center text-xs font-medium", wlV2 && sgWlV2.th)}
          >
            Rank
          </TableHead>
          <TableHead
            className={cn("text-left text-xs font-medium", wlV2 && sgWlV2.th)}
          >
            User
          </TableHead>
          <TableHead
            className={cn("text-center text-xs font-medium", wlV2 && sgWlV2.th)}
          >
            Total Points
          </TableHead>
          <TableHead
            className={cn("text-center text-xs font-medium", wlV2 && sgWlV2.th)}
          >
            Songs Picked
          </TableHead>
          <TableHead
            className={cn("text-center text-xs font-medium", wlV2 && sgWlV2.th)}
          >
            Sets Picked
          </TableHead>
          <TableHead
            className={cn(
              "!text-center text-xs font-medium",
              wlV2 && sgWlV2.th,
            )}
          >
            Show Opener
          </TableHead>
          <TableHead
            className={cn(
              "!text-center text-xs font-medium",
              wlV2 && sgWlV2.th,
            )}
          >
            Show Closer
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {standings.map((player, index) => (
          <TableRow
            key={player.userId}
            className={cn(
              user && player.userId === user.profileId ?
                wlV2 ?
                  "border-b bg-white/[0.07] transition-colors hover:bg-[rgba(88,200,174,0.11)]"
                : "bg-muted/60"
              : wlV2 ? sgWlV2.bodyRow
              : "hover:bg-muted/40",
            )}
          >
            <TableCell
              className={cn(
                "text-center text-xs font-medium",
                wlV2 ? sgWlV2.td : "px-2 py-0.5",
              )}
            >
              {index + 1}
            </TableCell>
            <TableCell className={cn(wlV2 ? sgWlV2.td : "px-2 py-0.5")}>
              <button
                type="button"
                onClick={() =>
                  onViewOtherUserSubmission(player.userId, player.username)
                }
                className={cn(
                  "text-left text-xs font-medium no-underline hover:underline focus:outline-none",
                  wlV2 && "text-white/90",
                )}
              >
                {player.username}
              </button>
            </TableCell>
            <TableCell
              className={cn(
                "text-center text-xs font-medium text-primary",
                wlV2 ? sgWlV2.td : "px-2 py-0.5",
              )}
            >
              {player.totalPoints}
            </TableCell>
            <TableCell
              className={cn(
                "text-center text-xs",
                wlV2 ? cn(sgWlV2.td, "text-white/65") : "text-muted-foreground px-2 py-0.5",
              )}
            >
              {player.songsPicked}
            </TableCell>
            <TableCell
              className={cn(
                "text-center text-xs",
                wlV2 ? cn(sgWlV2.td, "text-white/65") : "text-muted-foreground px-2 py-0.5",
              )}
            >
              {player.setsPicked}
            </TableCell>
            <TableCell className={cn(wlV2 ? sgWlV2.td : "px-2 py-0.5")}>
              <div className="flex justify-center">
                {player.showOpenerPicked ?
                  <Check className="size-3.5 text-green-500" />
                : <X className="size-3.5 text-red-400" />}
              </div>
            </TableCell>
            <TableCell className={cn(wlV2 ? sgWlV2.td : "px-2 py-0.5")}>
              <div className="flex justify-center">
                {player.showCloserPicked ?
                  <Check className="size-3.5 text-green-500" />
                : <X className="size-3.5 text-red-400" />}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  const tableBody =
    standings.length === 0 ?
      emptyBody
    : wlV2 ?
      <div className={sgWlV2.tableScroll}>{tableMarkup}</div>
    : tableMarkup

  if (wlV2) {
    return (
      <SetlistGameWlV2Panel title="Standings">{tableBody}</SetlistGameWlV2Panel>
    )
  }

  if (standings.length === 0) {
    return (
      <Card className="border-border/60 bg-card/80 py-0">
        <CardHeader className="py-3 bg-muted">
          <CardTitle className="text-sm">Standings</CardTitle>
        </CardHeader>
        <CardContent>{emptyBody}</CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60 bg-card/80 py-0 overflow-hidden">
      <CardHeader className="py-3 border-b border-border bg-muted">
        <CardTitle className="text-sm">Standings</CardTitle>
      </CardHeader>
      <div className="overflow-x-auto">{tableMarkup}</div>
    </Card>
  )
}
