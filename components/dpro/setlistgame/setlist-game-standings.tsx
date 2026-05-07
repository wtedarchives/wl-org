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
import { useStandingsData } from "@/hooks/use-standings-data"
import type { PlayerStats, SortField, SortDirection } from "./standings-types"
import type { WysteriaSession } from "@/lib/jwt"

interface SetlistGameStandingsProps {
  activeLeague: string
  user?: WysteriaSession | null
}

export function SetlistGameStandings({ activeLeague, user }: SetlistGameStandingsProps) {
  const [sortField, setSortField] = useState<SortField>("totalPoints")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const { standings, loading } = useStandingsData(
    activeLeague,
    sortField,
    sortDirection
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
      className={`text-xs cursor-pointer hover:bg-muted/50 ${
        align === "left" ? "text-left" : "text-center"
      }`}
    >
      <button
        type="button"
        className={`flex items-center gap-1 w-full ${
          align === "left" ? "justify-start" : "justify-center"
        }`}
        onClick={() => handleSort(field)}
      >
        {label}
        {sortField === field &&
          (sortDirection === "asc" ? (
            <ChevronUp className="size-3" />
          ) : (
            <ChevronDown className="size-3" />
          ))}
      </button>
    </TableHead>
  )

  if (loading) {
    return <LoadingPageCard message="Loading standings…" />
  }

  if (standings.length === 0) {
    return (
      <Card className="ring-0 border border-border/60 bg-card/80 py-0">
        <CardHeader className="py-2 flex flex-row items-center gap-2">
          <CardTitle className="text-sm">Standings</CardTitle>
          <span className="text-[10px] font-medium bg-muted px-1.5 py-0.5 rounded border border-border">
            {activeLeague}
          </span>
        </CardHeader>
        <CardContent className="py-4 text-center">
          <p className="text-xs text-muted-foreground">
            No standings available yet for this league.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="ring-0 border border-border/60 bg-card/80 py-0">
      <CardHeader className="py-2 flex flex-row items-center gap-2">
        <CardTitle className="text-sm">Standings</CardTitle>
        <span className="text-[10px] font-medium bg-muted px-1.5 py-0.5 rounded border border-border">
          {activeLeague}
        </span>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60">
              <TableHead className="text-center text-xs">Rank</TableHead>
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
            {standings.map((player, index) => (
              <TableRow
                key={player.userId}
                className={`text-[11px] ${
                  user && player.userId === user.profileId ? "bg-muted/60" : ""
                }`}
              >
                <TableCell className="px-2 py-0.5 text-center font-medium">
                  {index + 1}
                </TableCell>
                <TableCell className="px-2 py-0.5 font-medium">{player.username}</TableCell>
                <TableCell className="px-2 py-0.5 text-center font-medium">
                  {player.totalPoints}
                </TableCell>
                <TableCell className="px-2 py-0.5 text-center text-muted-foreground">
                  {player.showsPlayed}
                </TableCell>
                <TableCell className="px-2 py-0.5 text-center text-muted-foreground">
                  {player.avgPointsPerShow.toFixed(2)}
                </TableCell>
                <TableCell className="px-2 py-0.5 text-center text-muted-foreground">
                  {player.songsPicked}
                </TableCell>
                <TableCell className="px-2 py-0.5 text-center text-muted-foreground">
                  {player.setsPicked}
                </TableCell>
                <TableCell className="px-2 py-0.5 text-center text-muted-foreground">
                  {player.showOpenersPicked}
                </TableCell>
                <TableCell className="px-2 py-0.5 text-center text-muted-foreground">
                  {player.showClosersPicked}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
