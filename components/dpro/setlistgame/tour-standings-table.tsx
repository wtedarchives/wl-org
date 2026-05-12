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
import { cn } from "@/lib/utils"
import type { TourPlayerStats } from "@/hooks/use-setlist-game-tour-details"
import {
  SetlistGameWlV2Panel,
  sgWlV2,
  useSetlistGameWlV2Chrome,
} from "@/components/dpro/setlistgame/setlist-game-wl-v2-chrome"

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
  const wlV2 = useSetlistGameWlV2Chrome()
  const [sortField, setSortField] =
    useState<TourStandingsSortField>("totalPoints")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

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
  }, [standings, sortField, sortDirection, defaultOrder])

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
      className={cn(
        "text-xs font-medium",
        wlV2 && sgWlV2.th,
        align === "left" ? "text-left" : "text-center",
      )}
    >
      <button
        type="button"
        className={cn(
          wlV2 ?
            cn(
              sgWlV2.sortBtn,
              align === "left" ? "justify-start" : "justify-center",
            )
          : cn(
              "flex min-h-11 w-full items-center gap-1 px-0 py-1 md:min-h-0 cursor-pointer hover:bg-muted/50 rounded-sm transition-colors",
              align === "left" ? "justify-start" : "justify-center",
            ),
        )}
        onClick={() => handleSort(field)}
      >
        {label}
        {sortField === field &&
          (sortDirection === "asc" ?
            <ChevronUp className="size-3 shrink-0" aria-hidden />
          : <ChevronDown className="size-3 shrink-0" aria-hidden />)}
      </button>
    </TableHead>
  )

  const emptyBody = (
    <div className={wlV2 ? sgWlV2.emptyMsg : "py-4 text-center"}>
      <p className={wlV2 ? undefined : "text-xs text-muted-foreground"}>
        No standings available yet for this tour.
      </p>
    </div>
  )

  const tableMarkup = (
    <Table className={cn(wlV2 && sgWlV2.table)}>
      <TableHeader>
        <TableRow className={cn(wlV2 ? sgWlV2.headRow : "bg-muted/60 border-border")}>
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
            className={cn(
              currentUserId && player.userId === currentUserId ?
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
            <TableCell
              className={cn(
                "text-xs font-medium",
                wlV2 ? sgWlV2.td : "px-2 py-0.5",
              )}
            >
              {player.username}
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
              {player.showsPlayed}
            </TableCell>
            <TableCell
              className={cn(
                "text-center text-xs",
                wlV2 ? cn(sgWlV2.td, "text-white/65") : "text-muted-foreground px-2 py-0.5",
              )}
            >
              {player.avgPointsPerShow.toFixed(2)}
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
            <TableCell
              className={cn(
                "text-center text-xs",
                wlV2 ? cn(sgWlV2.td, "text-white/65") : "text-muted-foreground px-2 py-0.5",
              )}
            >
              {player.showOpenersPicked}
            </TableCell>
            <TableCell
              className={cn(
                "text-center text-xs",
                wlV2 ? cn(sgWlV2.td, "text-white/65") : "text-muted-foreground px-2 py-0.5",
              )}
            >
              {player.showClosersPicked}
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
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-semibold">Standings</CardTitle>
        </CardHeader>
        <CardContent>{emptyBody}</CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60 bg-card/80 py-0 overflow-hidden">
      <CardHeader className="py-3 border-b border-border">
        <CardTitle className="text-sm font-semibold">Standings</CardTitle>
      </CardHeader>
      <div className="overflow-x-auto">{tableMarkup}</div>
    </Card>
  )
}
