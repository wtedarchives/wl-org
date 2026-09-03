"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Clock, Users } from "@phosphor-icons/react"

import { useAuth } from "@/components/auth-context"
import { useAdminStatus } from "@/hooks/use-admin-status"
import type { GameShow } from "@/hooks/use-game-shows"
import { useGameShows } from "@/hooks/use-game-shows"
import { getEchoLiveShowUrl } from "@/lib/echo-archive-url"
import { echoTourSurfaceBgStyle } from "@/lib/echo-tour-surface-bg"
import { cn } from "@/lib/utils"

import { ECHO_ACTIVE_LEAGUE, type EchoShowStatus } from "./echo-tour-data"
import { EchoTourShowTimeDialog } from "./echo-tour-show-time-dialog"

function formatMmDd(dateInput: string): string {
  const date = new Date(
    dateInput.includes("T") ? dateInput : `${dateInput}T00:00:00Z`,
  )
  if (Number.isNaN(date.getTime())) return ""
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  return `${month}.${day}`
}

function showStatus(show: GameShow): {
  status: EchoShowStatus
  label: string
} {
  if (show.show_scored) return { status: "Scored", label: "Scored" }
  if (show.isSelectionClosed) return { status: "Closed", label: "Closed" }
  if (show.timeRemaining) {
    return { status: "Open", label: `${show.timeRemaining} left` }
  }
  return { status: "Open", label: "Open" }
}

function scoreLabel(show: GameShow) {
  if (show.show_scored && show.score != null) return String(show.score)
  return "—"
}

function picksStillOpen(show: GameShow) {
  return !show.show_scored && !show.isSelectionClosed
}

export function EchoTourShows({
  league = ECHO_ACTIVE_LEAGUE,
  allowAdmin = true,
  variant = "default",
  refreshKey = 0,
  onShowTimeSaved,
}: {
  league?: string
  allowAdmin?: boolean
  variant?: "default" | "history"
  /** Bump after admin scoring so tour dates refetch. */
  refreshKey?: number
  onShowTimeSaved?: () => void
}) {
  const isHistory = variant === "history"
  const { session } = useAuth()
  const { isAdmin } = useAdminStatus(session)
  const showAdminControls = allowAdmin && isAdmin
  const { loading, gameShows, fetchGameShows } = useGameShows(league, session)
  const [editingShow, setEditingShow] = useState<GameShow | null>(null)

  useEffect(() => {
    if (refreshKey === 0) return
    void fetchGameShows({ silent: true })
  }, [fetchGameShows, refreshKey])

  return (
    <div className="echo-tour-shows">
      <div
        className={cn(
          "echo-tour-shows-list",
          showAdminControls && "is-admin",
          isHistory && "is-history",
        )}
        style={echoTourSurfaceBgStyle("shows")}
      >
        <h2 className="echo-tour-shows-title" id="echo-tour-dates-heading">
          Tour dates
        </h2>
        {loading || gameShows.length === 0 ?
          <div className="echo-tour-shows-empty">
            {loading ? "Loading tour dates…" : "No shows on this tour."}
          </div>
        : <div
            className="echo-tour-shows-scroll"
            role="region"
            aria-labelledby="echo-tour-dates-heading"
          >
            <table className="echo-tour-shows-table">
            <colgroup>
              <col className="echo-tour-col-date" />
              {!isHistory ?
                <col className="echo-tour-col-venue" />
              : null}
              <col className="echo-tour-col-city" />
              {!isHistory ?
                <col className="echo-tour-col-status" />
              : null}
              <col className="echo-tour-col-players" />
              <col className="echo-tour-col-score" />
            </colgroup>
            <thead className="echo-tour-shows-head">
              <tr>
                <th scope="col">Date</th>
                {!isHistory ?
                  <th scope="col">Venue</th>
                : null}
                <th scope="col">Location</th>
                {!isHistory ?
                  <th scope="col">Status</th>
                : null}
                <th scope="col">Players</th>
                <th scope="col">Score</th>
              </tr>
            </thead>
            <tbody>
              {gameShows.map((show) => {
                const statusInfo = showStatus(show)
                const detail = show.show_detail?.trim()
                const myScore = scoreLabel(show)
                const canPick = picksStillOpen(show)
                return (
                  <tr key={show.show_id} className="echo-tour-show-row">
                    <td className="echo-tour-show-date">
                      <div className="echo-tour-show-date-inner">
                        <Link
                          href={getEchoLiveShowUrl(show.show_id)}
                          className="echo-tour-show-date-link"
                          scroll={false}
                        >
                          {formatMmDd(show.show_date)}
                        </Link>
                        {showAdminControls ?
                          <button
                            type="button"
                            className="echo-tour-show-time-btn"
                            aria-label={`Edit show time (Eastern) for ${show.show_subvenue}`}
                            onClick={() => setEditingShow(show)}
                          >
                            <Clock size={16} weight="regular" aria-hidden />
                          </button>
                        : null}
                      </div>
                    </td>
                    {!isHistory ?
                      <td className="echo-tour-show-venue">
                        <div className="echo-tour-show-venue-inner">
                          <span className="echo-tour-show-venue-name">
                            {show.show_subvenue}
                          </span>
                          {detail ?
                            <span className="echo-tour-show-venue-detail">
                              {detail}
                            </span>
                          : null}
                        </div>
                      </td>
                    : null}
                    <td className="echo-tour-show-city">
                      {show.show_venue_location}
                    </td>
                    {!isHistory ?
                      <td className="echo-tour-show-status">
                        <span
                          className="echo-tour-pill"
                          data-status={statusInfo.status}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                    : null}
                    <td
                      className="echo-tour-show-players"
                      aria-label={`${show.playerCount ?? 0} ${(show.playerCount ?? 0) === 1 ? "player" : "players"}`}
                    >
                      <div className="echo-tour-show-players-inner">
                        <span>{show.playerCount ?? 0}</span>
                        <Users size={14} weight="regular" aria-hidden />
                      </div>
                    </td>
                    <td
                      className={cn(
                        "echo-tour-show-score",
                        !canPick && myScore === "—" && "is-empty",
                      )}
                    >
                      {canPick ?
                        <Link
                          href={getEchoLiveShowUrl(show.show_id)}
                          className="echo-tour-show-picks-btn"
                          scroll={false}
                        >
                          {show.submission_id ? "Edit Picks" : "Make Picks"}
                        </Link>
                      : myScore}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>}
      </div>
      <EchoTourShowTimeDialog
        show={editingShow}
        open={editingShow != null}
        onOpenChange={(next) => {
          if (!next) setEditingShow(null)
        }}
        onSaved={async () => {
          await fetchGameShows({ silent: true })
          onShowTimeSaved?.()
        }}
      />
    </div>
  )
}
