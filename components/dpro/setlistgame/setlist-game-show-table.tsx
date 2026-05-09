"use client"

import Link from "next/link"
import { formatSetlistDate } from "@/lib/setlist-utils"
import type { GameShow } from "@/hooks/use-game-shows"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { getSetlistGameShowArchiveUrl } from "@/lib/setlist-game-archive-url"
import { AdminShowTimeCell } from "./admin-show-time-cell"
import type { WysteriaSession } from "@/lib/jwt"

interface SetlistGameShowTableProps {
  gameShows: GameShow[]
  user: WysteriaSession | null
  onSelectSongs: (show: GameShow) => void
  onViewSubmission: (show: GameShow) => void
  isAdminUser?: boolean
  onShowTimeSaved?: () => void | Promise<void>
}

export function SetlistGameShowTable({
  gameShows,
  user,
  onSelectSongs,
  onViewSubmission,
  isAdminUser = false,
  onShowTimeSaved,
}: SetlistGameShowTableProps) {
  const showAdminShowTime = Boolean(isAdminUser && onShowTimeSaved)

  if (gameShows.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-xs">No active games found in this league.</p>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto [-webkit-overflow-scrolling:touch]">
      <Table>
      <TableHeader>
        <TableRow className="bg-muted/60">
          <TableHead className="text-center text-xs">Date</TableHead>
          <TableHead className="text-xs">Venue</TableHead>
          <TableHead className="text-xs">Location</TableHead>
          <TableHead className="text-xs">Detail</TableHead>
          <TableHead className="text-center text-xs">Status</TableHead>
          <TableHead className="text-center text-xs">Players</TableHead>
          {user && <TableHead className="text-center text-xs">Score</TableHead>}
          <TableHead className="text-center text-xs">Picks</TableHead>
          {showAdminShowTime && (
            <TableHead className="text-center text-xs">Show Time (ET)</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {gameShows.map((show) => (
            <TableRow key={show.show_id} className="text-[11px]">
              <TableCell className="px-2 py-0.5 text-center font-medium">
                <Link
                  href={getSetlistGameShowArchiveUrl(show.show_id)}
                  className="no-underline hover:underline hover:text-foreground"
                >
                  {formatSetlistDate(show.show_date)}
                </Link>
              </TableCell>
              <TableCell className="px-2 py-0.5 text-muted-foreground">{show.show_subvenue}</TableCell>
              <TableCell className="px-2 py-0.5 text-muted-foreground">{show.show_venue_location}</TableCell>
              <TableCell className="px-2 py-0.5 text-muted-foreground">{show.show_detail || ""}</TableCell>
              <TableCell className="px-2 py-0.5 text-center">
                {show.show_scored ? (
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-blue-600 text-white">
                    Scored
                  </span>
                ) : show.isSelectionClosed ? (
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-red-600 text-white">
                    Closed
                  </span>
                ) : show.isLessThan24Hours ? (
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-600 text-white">
                    {show.timeRemaining} left
                  </span>
                ) : (
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-green-600 text-white">
                    {show.timeRemaining} left
                  </span>
                )}
              </TableCell>
              <TableCell className="px-2 py-0.5 text-center text-muted-foreground">
                {show.playerCount ?? ""}
              </TableCell>
              {user && (
                <TableCell className="px-2 py-0.5 text-center">
                  {show.show_scored && show.score != null ? (
                    <span className="font-medium">{show.score}</span>
                  ) : null}
                </TableCell>
              )}
              <TableCell className="px-2 py-0.5 text-center">
                {show.show_scored ? (
                  user && show.submission_id ? (
                    <Button
                      variant="default"
                      size="xs"
                      onClick={() => onViewSubmission(show)}
                    >
                      View Results
                    </Button>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">
                      Scored
                    </span>
                  )
                ) : show.isSelectionClosed ? (
                  user && show.submission_id ? (
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => onViewSubmission(show)}
                    >
                      View Picks
                    </Button>
                  ) : (
                    <Button variant="outline" size="xs" disabled>
                      Closed
                    </Button>
                  )
                ) : user ? (
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => onSelectSongs(show)}
                  >
                    {show.submission_id ? "Edit Picks" : "Make Picks"}
                  </Button>
                ) : (
                  <Button variant="outline" size="xs" asChild>
                    <Link href="/login" className="no-underline hover:underline">Login to Play</Link>
                  </Button>
                )}
              </TableCell>
              {showAdminShowTime && onShowTimeSaved && (
                <TableCell className="px-2 py-1 text-center align-middle">
                  <AdminShowTimeCell show={show} onSaved={onShowTimeSaved} />
                </TableCell>
              )}
            </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
  )
}