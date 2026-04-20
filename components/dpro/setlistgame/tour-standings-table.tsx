"use client"

import { useMemo, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
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

type SortDirection = "asc" | "desc"

type TourStandingsSortField =
  | "rank"
  | "username"
  | "totalPoints"
  | "showsPlayed"
  | "avgPointsPerShow"
  | "songsPicked"
  | "setsPicked"
  | "showOpenersPicked"
  | "showClosersPicked"

interface TourStandingsTableProps {
  standings: TourPlayerStats[]
  currentUserId?: string
}

function compareTourPlayers(
  a: TourPlayerStats,
  b: TourPlayerStats,
  field: TourStandingsSortField,
  defaultOrder: Map<string, number>,
): number {
  switch (field) {
    case "rank": {
      const ai = defaultOrder.get(a.userId) ?? 0
      const bi = defaultOrder.get(b.userId) ?? 0
      return ai - bi
    }
    case "username":
      return a.username.localeCompare(b.username, undefined, {
        sensitivity: "base",
      })
    case "totalPoints":
      return a.totalPoints - b.totalPoints
    case "showsPlayed":
      return a.showsPlayed - b.showsPlayed
    case "avgPointsPerShow":
      return a.avgPointsPerShow - b.avgPointsPerShow
    case "songsPicked":
      return a.songsPicked - b.songsPicked
    case "setsPicked":
      return a.setsPicked - b.setsPicked
    case "showOpenersPicked":
      return a.showOpenersPicked - b.showOpenersPicked
    case "showClosersPicked":
      return a.showClosersPicked - b.showClosersPicked
    default:
      return 0
  }
}

export function TourStandingsTable({
  standings,
  currentUserId,
}: TourStandingsTableProps) {
  const [sortField, setSortField] =
    useState<TourStandingsSortField>("totalPoints")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  /** Baseline row order from the latest `standings` prop (for "Rank" column sort). */
  const defaultOrder = useMemo(
    () => new Map(standings.map((p, i) => [p.userId, i])),
    [standings],
  )

  const sortedStandings = useMemo(() => {
    const copy = [...standings]
    copy.sort((a, b) => {
      const cmp = compareTourPlayers(a, b, sortField, defaultOrder)
      if (cmp !== 0) {
        return sortDirection === "asc" ? cmp : -cmp
      }
      return a.userId.localeCompare(b.userId)
    })
    return copy
  }, [standings, sortField, sortDirection])

  const handleSort = (field: TourStandingsSortField) => {
    if (field === sortField) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDirection(field === "username" || field === "rank" ? "asc" : "desc")
    }
  }

  const SortHeader = ({
    field,
    label,
    align = "center",
  }: {
    field: TourStandingsSortField
    label: string
    align?: "left" | "center"
  }) => (
    <TableHead
      className={`text-xs font-medium ${
        align === "left" ? "text-left" : "text-center"
      }`}
    >
      <button
        type="button"
        className={`flex min-h-11 w-full items-center gap-1 px-0 py-1 md:min-h-0 ${
          align === "left" ? "justify-start" : "justify-center"
        } cursor-pointer hover:bg-muted/50 rounded-sm transition-colors`}
        onClick={() => handleSort(field)}
      >
        {label}
        {sortField === field &&
          (sortDirection === "asc" ? (
            <ChevronUp className="size-3 shrink-0" aria-hidden />
          ) : (
            <ChevronDown className="size-3 shrink-0" aria-hidden />
          ))}
      </button>
    </TableHead>
  )

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
              <SortHeader field="rank" label="Rank" />
              <SortHeader field="username" label="User" align="left" />
              <SortHeader field="totalPoints" label="Total Points" />
              <SortHeader field="showsPlayed" label="Shows Played" />
              <SortHeader field="avgPointsPerShow" label="Pts/Show" />
              <SortHeader field="songsPicked" label="Songs" />
              <SortHeader field="setsPicked" label="Sets" />
              <SortHeader field="showOpenersPicked" label="Openers" />
              <SortHeader field="showClosersPicked" label="Closers" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStandings.map((player, index) => (
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
