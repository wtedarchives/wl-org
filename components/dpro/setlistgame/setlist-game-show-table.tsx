"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { formatSetlistDate } from "@/lib/setlist-utils"
import type { GameShow } from "@/hooks/use-game-shows"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSetlistGameArchiveUrlShell } from "@/components/dpro/setlistgame/setlist-game-archive-url-shell-context"
import { getSetlistGameShowArchiveUrl } from "@/lib/setlist-game-archive-url"
import { sgWlV2 } from "@/components/dpro/setlistgame/setlist-game-wl-v2-chrome"
import "@/components/dpro/tours/tour-shows-stat-pill.css"
import "@/components/dpro/setlistgame/setlist-game-stat-pills.css"
import { AdminShowTimeCell } from "./admin-show-time-cell"
import { useWlHomeV2LoginAction } from "@/components/wl-home-v2/wl-home-v2-open-login-context"
import type { WysteriaSession } from "@/lib/jwt"

function StatPillButton({
  variant,
  children,
  onClick,
  disabled,
}: {
  variant: "action" | "info" | "neutral" | "muted"
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "tour-shows-stat-pill",
        "setlist-game-pill-picks",
        `setlist-game-pill-picks--${variant}`,
        "disabled:cursor-not-allowed disabled:opacity-45",
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

interface SetlistGameShowTableProps {
  /** Table body only; parent provides {@link SetlistGameWlV2Panel} + wp-head. */
  embeddedInWlPanel?: boolean
  gameShows: GameShow[]
  user: WysteriaSession | null
  onSelectSongs: (show: GameShow) => void
  onViewSubmission: (show: GameShow) => void
  isAdminUser?: boolean
  onShowTimeSaved?: () => void | Promise<void>
}

export function SetlistGameShowTable({
  embeddedInWlPanel = false,
  gameShows,
  user,
  onSelectSongs,
  onViewSubmission,
  isAdminUser = false,
  onShowTimeSaved,
}: SetlistGameShowTableProps) {
  const urlShell = useSetlistGameArchiveUrlShell()
  const openLogin = useWlHomeV2LoginAction()
  const showAdminShowTime = Boolean(isAdminUser && onShowTimeSaved)
  const v2 = embeddedInWlPanel

  if (gameShows.length === 0) {
    const empty = (
      <p className={v2 ? sgWlV2.emptyMsg : "text-muted-foreground text-xs"}>
        No active games found in this league.
      </p>
    )
    if (v2) {
      return <div className={sgWlV2.tableScroll}>{empty}</div>
    }
    return <div className="text-center py-8">{empty}</div>
  }

  const statusCell = (show: GameShow) => {
    if (v2) {
      if (show.show_scored) {
        return (
          <span className="tour-shows-stat-pill setlist-game-pill-status--scored">
            Scored
          </span>
        )
      }
      if (show.isSelectionClosed) {
        return (
          <span className="tour-shows-stat-pill setlist-game-pill-status--closed">
            Closed
          </span>
        )
      }
      if (show.isLessThan24Hours) {
        return (
          <span className="tour-shows-stat-pill setlist-game-pill-status--warning">
            {show.timeRemaining} left
          </span>
        )
      }
      return (
        <span className="tour-shows-stat-pill setlist-game-pill-status--open">
          {show.timeRemaining} left
        </span>
      )
    }
    return show.show_scored ?
        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-blue-600 text-white">
          Scored
        </span>
      : show.isSelectionClosed ?
        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-red-600 text-white">
          Closed
        </span>
      : show.isLessThan24Hours ?
        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-600 text-white">
          {show.timeRemaining} left
        </span>
      : <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-green-600 text-white">
          {show.timeRemaining} left
        </span>
  }

  const picksCell = (show: GameShow) => {
    if (v2) {
      if (show.show_scored) {
        if (user && show.submission_id) {
          return (
            <StatPillButton
              variant="info"
              onClick={() => onViewSubmission(show)}
            >
              View Results
            </StatPillButton>
          )
        }
        return (
          <span className="tour-shows-stat-pill setlist-game-pill-picks--muted">
            Scored
          </span>
        )
      }
      if (show.isSelectionClosed) {
        if (user && show.submission_id) {
          return (
            <StatPillButton
              variant="info"
              onClick={() => onViewSubmission(show)}
            >
              View Picks
            </StatPillButton>
          )
        }
        return (
          <StatPillButton variant="neutral" disabled>
            Closed
          </StatPillButton>
        )
      }
      if (user) {
        return (
          <StatPillButton
            variant="action"
            onClick={() => onSelectSongs(show)}
          >
            {show.submission_id ? "Edit Picks" : "Make Picks"}
          </StatPillButton>
        )
      }
      return (
        <button
          type="button"
          className="tour-shows-stat-pill setlist-game-pill-picks setlist-game-pill-picks--neutral inline-block"
          onClick={() => openLogin()}
        >
          Login to Play
        </button>
      )
    }

    return show.show_scored ?
        user && show.submission_id ?
          <Button
            variant="default"
            size="xs"
            onClick={() => onViewSubmission(show)}
          >
            View Results
          </Button>
        : <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">
            Scored
          </span>
      : show.isSelectionClosed ?
        user && show.submission_id ?
          <Button
            variant="secondary"
            size="xs"
            onClick={() => onViewSubmission(show)}
          >
            View Picks
          </Button>
        : <Button variant="outline" size="xs" disabled>
            Closed
          </Button>
      : user ?
        <Button
          variant="secondary"
          size="xs"
          onClick={() => onSelectSongs(show)}
        >
          {show.submission_id ? "Edit Picks" : "Make Picks"}
        </Button>
      : <Button variant="outline" size="xs" onClick={() => openLogin()}>
          Login to Play
        </Button>
  }

  const tableInner = (
    <Table className={cn(v2 && sgWlV2.table)}>
      <TableHeader>
        <TableRow className={cn(v2 ? sgWlV2.headRow : "bg-muted/60")}>
          <TableHead
            className={cn(
              "text-center text-xs",
              v2 ? sgWlV2.th : undefined,
            )}
          >
            Date
          </TableHead>
          <TableHead
            className={cn("text-xs", v2 ? sgWlV2.th : undefined)}
          >
            Venue
          </TableHead>
          <TableHead
            className={cn("text-xs", v2 ? sgWlV2.th : undefined)}
          >
            Location
          </TableHead>
          <TableHead
            className={cn("text-xs", v2 ? sgWlV2.th : undefined)}
          >
            Detail
          </TableHead>
          <TableHead
            className={cn("text-center text-xs", v2 ? sgWlV2.th : undefined)}
          >
            Status
          </TableHead>
          <TableHead
            className={cn("text-center text-xs", v2 ? sgWlV2.th : undefined)}
          >
            Players
          </TableHead>
          {user ?
            <TableHead
              className={cn("text-center text-xs", v2 ? sgWlV2.th : undefined)}
            >
              Score
            </TableHead>
          : null}
          <TableHead
            className={cn("text-center text-xs", v2 ? sgWlV2.th : undefined)}
          >
            Picks
          </TableHead>
          {showAdminShowTime ?
            <TableHead
              className={cn("text-center text-xs", v2 ? sgWlV2.th : undefined)}
            >
              Show Time (ET)
            </TableHead>
          : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {gameShows.map((show) => (
          <TableRow
            key={show.show_id}
            className={cn("text-[11px]", v2 ? sgWlV2.bodyRow : undefined)}
          >
            <TableCell
              className={cn(
                "text-center font-medium",
                v2 ? sgWlV2.td : "px-2 py-0.5",
              )}
            >
              <Link
                href={getSetlistGameShowArchiveUrl(show.show_id, urlShell)}
                className="no-underline hover:underline hover:text-foreground"
              >
                {formatSetlistDate(show.show_date)}
              </Link>
            </TableCell>
            <TableCell
              className={cn(
                v2 ? cn(sgWlV2.td, "text-white/65") : "px-2 py-0.5 text-muted-foreground",
              )}
            >
              {show.show_subvenue}
            </TableCell>
            <TableCell
              className={cn(
                v2 ? cn(sgWlV2.td, "text-white/65") : "px-2 py-0.5 text-muted-foreground",
              )}
            >
              {show.show_venue_location}
            </TableCell>
            <TableCell
              className={cn(
                v2 ? cn(sgWlV2.td, "text-white/65") : "px-2 py-0.5 text-muted-foreground",
              )}
            >
              {show.show_detail || ""}
            </TableCell>
            <TableCell
              className={cn("text-center", v2 ? sgWlV2.td : "px-2 py-0.5")}
            >
              {statusCell(show)}
            </TableCell>
            <TableCell
              className={cn(
                "text-center",
                v2 ? cn(sgWlV2.td, "text-white/65") : "px-2 py-0.5 text-muted-foreground",
              )}
            >
              {show.playerCount ?? ""}
            </TableCell>
            {user ?
              <TableCell
                className={cn("text-center", v2 ? sgWlV2.td : "px-2 py-0.5")}
              >
                {show.show_scored && show.score != null ?
                  <span className="font-medium">{show.score}</span>
                : null}
              </TableCell>
            : null}
            <TableCell
              className={cn("text-center", v2 ? sgWlV2.td : "px-2 py-0.5")}
            >
              {picksCell(show)}
            </TableCell>
            {showAdminShowTime && onShowTimeSaved ?
              <TableCell
                className={cn(
                  "text-center align-middle",
                  v2 ? sgWlV2.td : "px-2 py-1",
                )}
              >
                <AdminShowTimeCell show={show} onSaved={onShowTimeSaved} />
              </TableCell>
            : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  if (v2) {
    return <div className={sgWlV2.tableScroll}>{tableInner}</div>
  }

  return (
    <div className="w-full overflow-x-auto [-webkit-overflow-scrolling:touch]">
      {tableInner}
    </div>
  )
}
