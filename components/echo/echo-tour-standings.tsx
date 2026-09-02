"use client"

import { useLayoutEffect, useRef } from "react"

import { useAuth } from "@/components/auth-context"
import { useStandingsData } from "@/hooks/use-standings-data"
import { formatOrdinal } from "@/lib/setlist-utils"
import { cn } from "@/lib/utils"

import { ECHO_ACTIVE_LEAGUE, type EchoStandingRow } from "./echo-tour-data"

export function EchoTourStandingsList({
  rows,
  className,
}: {
  rows: EchoStandingRow[]
  className?: string
}) {
  const listRef = useRef<HTMLDivElement>(null)
  const meRowRef = useRef<HTMLDivElement>(null)
  const didScrollRef = useRef(false)

  useLayoutEffect(() => {
    if (didScrollRef.current) return
    const list = listRef.current
    const row = meRowRef.current
    if (!list || !row) return

    didScrollRef.current = true
    const listBox = list.getBoundingClientRect()
    const rowBox = row.getBoundingClientRect()
    list.scrollTop +=
      rowBox.top - listBox.top - listBox.height / 2 + rowBox.height / 2
  }, [rows])

  return (
    <div ref={listRef} className={cn("echo-tour-standings", className)}>
      {rows.map((row) => (
        <div
          key={`${row.rank}-${row.name}`}
          ref={row.isMe ? meRowRef : undefined}
          className={cn("echo-tour-standings-row", row.isMe && "is-me")}
        >
          <span className="echo-tour-standings-rank">{row.rank}</span>
          <span
            className={cn(
              "echo-tour-standings-name",
              row.isMe && "is-me",
            )}
          >
            {row.name}
          </span>
          <span className="echo-tour-standings-pts">{row.points}</span>
        </div>
      ))}
    </div>
  )
}

export function EchoTourStandingsCard() {
  const { session } = useAuth()
  const { standings, loading } = useStandingsData(
    ECHO_ACTIVE_LEAGUE,
    "totalPoints",
    "desc",
  )

  const rows: EchoStandingRow[] = standings.map((player, index) => ({
    rank: index + 1,
    name: player.username,
    points: player.totalPoints,
    isMe: Boolean(session?.profileId && player.userId === session.profileId),
  }))

  const me = rows.find((row) => row.isMe)
  const playerCount = rows.length
  const rankLabel = me ? formatOrdinal(me.rank) : loading ? "\u00a0" : "—"
  const ofPlayers = loading ? "\u00a0" : `of ${playerCount}`
  const pointsLabel =
    me ?
      `${me.points} point${me.points === 1 ? "" : "s"}`
    : null

  return (
    <div className="echo-tour-card echo-tour-card--standings">
      <div className="echo-tour-card-head">
        <div className="echo-tour-kicker">Tour Standings</div>
        <a
          href="#"
          className="echo-tour-kicker echo-tour-see-more"
          onClick={(event) => event.preventDefault()}
        >
          See more →
        </a>
      </div>
      <div className="echo-tour-rank-row">
        <div className="echo-tour-rank-cluster">
          <span className="echo-tour-rank">{rankLabel}</span>
          <span className="echo-tour-rank-of">{ofPlayers}</span>
        </div>
        {pointsLabel ?
          <span className="echo-tour-points-pill">{pointsLabel}</span>
        : null}
      </div>
      {loading ?
        <div className="echo-tour-standings-wrap">
          <div className="echo-tour-standings echo-tour-standings--empty">
            Loading standings…
          </div>
        </div>
      : rows.length === 0 ?
        <div className="echo-tour-standings-wrap">
          <div className="echo-tour-standings echo-tour-standings--empty">
            No scored shows yet.
          </div>
        </div>
      : <div className="echo-tour-standings-wrap">
          <EchoTourStandingsList rows={rows} />
        </div>}
    </div>
  )
}
