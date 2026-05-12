"use client"

import { useState } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
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
import { useStandingsData } from "@/hooks/use-standings-data"
import type { PlayerStats, SortField, SortDirection } from "./standings-types"
import type { WysteriaSession } from "@/lib/jwt"
import {
  SetlistGameWlV2Panel,
  sgWlV2,
  useSetlistGameWlV2Chrome,
} from "@/components/dpro/setlistgame/setlist-game-wl-v2-chrome"

interface SetlistGameStandingsProps {
  activeLeague: string
  user?: WysteriaSession | null
}

export function SetlistGameStandings({
  activeLeague,
  user,
}: SetlistGameStandingsProps) {
  const wlV2 = useSetlistGameWlV2Chrome()
  const [sortField, setSortField] = useState<SortField>("totalPoints")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const { standings, loading } = useStandingsData(
    activeLeague,
    sortField,
    sortDirection,
  )

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const SortHeader = ({
    field,
    label,
    align = "center",
  }: {
    field: SortField
    label: string
    align?: "left" | "center"
  }) => (
    <TableHead
      className={cn(
        "text-xs",
        field === "username" ? "setlist-game-standings-user-header" : null,
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
              "flex w-full cursor-pointer items-center gap-1 rounded-sm px-1 hover:bg-muted/50",
              align === "left" ? "justify-start" : "justify-center",
            ),
        )}
        onClick={() => handleSort(field)}
      >
        {label}
        {sortField === field &&
          (sortDirection === "asc" ?
            <ChevronUp className="size-3" />
          : <ChevronDown className="size-3" />)}
      </button>
    </TableHead>
  )

  if (loading) {
    return wlV2 ?
        <WlHomeV2PageLoading message="Loading standings…" />
      : <LoadingPageCard message="Loading standings…" />
  }

  const leaguePill = (
    <span
      className={
        wlV2 ?
          "text-[10px] font-medium text-white/55"
        : "rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium"
      }
    >
      {activeLeague}
    </span>
  )

  const tableMarkup = (
    <Table
      className={cn(
        "setlist-game-standings-table",
        wlV2 && sgWlV2.table,
      )}
    >
      <TableHeader>
        <TableRow className={cn(wlV2 ? sgWlV2.headRow : "bg-muted/60")}>
          <TableHead
            className={cn("text-center text-xs", wlV2 && sgWlV2.th)}
          >
            Rank
          </TableHead>
          <SortHeader field="username" label="User" align="left" />
          <SortHeader field="totalPoints" label="Total Points" />
          <SortHeader field="showsPlayed" label="Shows Played" />
          <SortHeader field="avgPointsPerShow" label="Points Per Show" />
          <SortHeader field="songsPicked" label="Songs Picked" />
          <SortHeader field="setsPicked" label="Sets Picked" />
          <SortHeader field="showOpenersPicked" label="Openers Picked" />
          <SortHeader field="showClosersPicked" label="Closers Picked" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {standings.map((player: PlayerStats, index: number) => (
          <TableRow
            key={player.userId}
            className={cn(
              "text-[11px]",
              user && player.userId === user.profileId ?
                wlV2 ?
                  "border-b bg-white/[0.07] transition-colors hover:bg-[rgba(88,200,174,0.11)]"
                : "bg-muted/60"
              : wlV2 ? sgWlV2.bodyRow
              : "",
            )}
          >
            <TableCell
              className={cn(
                "px-2 py-0.5 text-center font-medium",
                wlV2 && sgWlV2.td,
              )}
            >
              {index + 1}
            </TableCell>
            <TableCell
              className={cn(
                "setlist-game-standings-user-cell px-2 py-0.5 font-medium",
                wlV2 && sgWlV2.td,
              )}
            >
              {player.username}
            </TableCell>
            <TableCell
              className={cn(
                "px-2 py-0.5 text-center font-medium",
                wlV2 && sgWlV2.td,
              )}
            >
              {player.totalPoints}
            </TableCell>
            <TableCell
              className={cn(
                "px-2 py-0.5 text-center",
                wlV2 ? cn(sgWlV2.td, "text-white/65") : "text-muted-foreground",
              )}
            >
              {player.showsPlayed}
            </TableCell>
            <TableCell
              className={cn(
                "px-2 py-0.5 text-center",
                wlV2 ? cn(sgWlV2.td, "text-white/65") : "text-muted-foreground",
              )}
            >
              {player.avgPointsPerShow.toFixed(2)}
            </TableCell>
            <TableCell
              className={cn(
                "px-2 py-0.5 text-center",
                wlV2 ? cn(sgWlV2.td, "text-white/65") : "text-muted-foreground",
              )}
            >
              {player.songsPicked}
            </TableCell>
            <TableCell
              className={cn(
                "px-2 py-0.5 text-center",
                wlV2 ? cn(sgWlV2.td, "text-white/65") : "text-muted-foreground",
              )}
            >
              {player.setsPicked}
            </TableCell>
            <TableCell
              className={cn(
                "px-2 py-0.5 text-center",
                wlV2 ? cn(sgWlV2.td, "text-white/65") : "text-muted-foreground",
              )}
            >
              {player.showOpenersPicked}
            </TableCell>
            <TableCell
              className={cn(
                "px-2 py-0.5 text-center",
                wlV2 ? cn(sgWlV2.td, "text-white/65") : "text-muted-foreground",
              )}
            >
              {player.showClosersPicked}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  const emptyBody = (
    <div className={wlV2 ? sgWlV2.emptyMsg : "py-4 text-center"}>
      <p className={wlV2 ? undefined : "text-xs text-muted-foreground"}>
        No standings available yet for this league.
      </p>
    </div>
  )

  const tableBody =
    standings.length === 0 ?
      emptyBody
    : wlV2 ?
      <div className={sgWlV2.tableScroll}>{tableMarkup}</div>
    : tableMarkup

  if (wlV2) {
    return (
      <SetlistGameWlV2Panel title="Standings" titleRight={leaguePill}>
        {tableBody}
      </SetlistGameWlV2Panel>
    )
  }

  if (standings.length === 0) {
    return (
      <Card className="ring-0 border border-border/60 bg-card/80 py-0">
        <CardHeader className="flex flex-row items-center gap-2 py-2">
          <CardTitle className="text-sm">Standings</CardTitle>
          {leaguePill}
        </CardHeader>
        <CardContent>{emptyBody}</CardContent>
      </Card>
    )
  }

  return (
    <Card className="ring-0 border border-border/60 bg-card/80 py-0">
      <CardHeader className="flex flex-row items-center gap-2 py-2">
        <CardTitle className="text-sm">Standings</CardTitle>
        {leaguePill}
      </CardHeader>
      <CardContent className="p-0">{tableBody}</CardContent>
    </Card>
  )
}
