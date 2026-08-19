"use client"

import Link from "next/link"

import type { GameShow } from "@/hooks/use-game-shows"
import type { PlayerStats } from "@/components/dpro/setlistgame/standings-types"
import { EchoOfAShowCountdown } from "@/components/echo-of-a-show/echo-of-a-show-countdown"
import {
  echoLegShortLabel,
  formatEchoMdDate,
  formatEchoOrdinal,
  formatEchoUsername,
} from "@/lib/echo-of-a-show"
import {
  getEchoOfAShowShowUrl,
  getEchoOfAShowTourUrl,
} from "@/lib/echo-of-a-show-url"
import { getUserProfileUrl } from "@/lib/user-profile-url"

function standingsRailRows(
  standings: PlayerStats[],
  userId: string | undefined,
): PlayerStats[] {
  if (standings.length === 0) return []
  if (!userId) return standings.slice(0, 5)
  const userIndex = standings.findIndex((row) => row.userId === userId)
  if (userIndex < 0 || userIndex < 5) return standings.slice(0, 5)
  return [...standings.slice(0, 4), standings[userIndex]!]
}

export function EchoOfAShowRail({
  standings,
  userId,
  lastShow,
  remaining,
  league,
  tourId,
}: {
  standings: PlayerStats[]
  userId?: string
  lastShow: GameShow | null
  remaining: GameShow[]
  league: string
  tourId: string | null
}) {
  const you = userId
    ? standings.find((row) => row.userId === userId)
    : undefined
  const youRank = you
    ? standings.findIndex((row) => row.userId === userId) + 1
    : 0
  const rows = standingsRailRows(standings, userId)
  const seasonHref = tourId ? getEchoOfAShowTourUrl(tourId) : null

  return (
    <aside className="echo-of-a-show__rail">
      {you ?
        <div className="echo-of-a-show__stat-pair">
          <div className="echo-of-a-show__stat-card">
            <div className="echo-of-a-show__stat-label">Season rank</div>
            <div className="echo-of-a-show__stat-value">
              {formatEchoOrdinal(youRank)}
              <span>of {standings.length}</span>
            </div>
            <div className="echo-of-a-show__stat-foot echo-of-a-show__stat-foot--mint">
              {you.totalPoints.toLocaleString()} pts
            </div>
          </div>
          <div className="echo-of-a-show__stat-card">
            <div className="echo-of-a-show__stat-label">Last show</div>
            {lastShow ?
              <Link
                href={getEchoOfAShowShowUrl(lastShow.show_id)}
                className="echo-of-a-show__last-show-link"
              >
                <div className="echo-of-a-show__stat-value">
                  {lastShow.score ?? 0}
                  <span>pts</span>
                </div>
                <div className="echo-of-a-show__stat-foot">
                  {formatEchoMdDate(lastShow.show_date)}
                  {lastShow.show_venue_location
                    ? ` · ${lastShow.show_venue_location}`
                    : ""}
                </div>
              </Link>
            : <div className="echo-of-a-show__empty">No scored show yet.</div>}
          </div>
        </div>
      : null}

      <section className="echo-of-a-show__panel">
        <div className="echo-of-a-show__standings-head">
          <span className="echo-of-a-show__stat-label">Season standings</span>
          <span className="echo-of-a-show__meta">{echoLegShortLabel(league)}</span>
        </div>
        {rows.length === 0 ?
          <p className="echo-of-a-show__empty echo-of-a-show__empty--inset">
            Standings appear after the first scored show.
          </p>
        : <div className="echo-of-a-show__standings-list">
            {rows.map((row) => {
              const rank =
                standings.findIndex((s) => s.userId === row.userId) + 1
              const isYou = Boolean(userId && row.userId === userId)
              return (
                <Link
                  key={row.userId}
                  href={getUserProfileUrl(row.userId)}
                  className={
                    isYou
                      ? "echo-of-a-show__standing-row echo-of-a-show__standing-row--you"
                      : "echo-of-a-show__standing-row"
                  }
                >
                  <span
                    className={
                      isYou
                        ? "echo-of-a-show__standing-rank echo-of-a-show__standing-rank--you"
                        : rank === 1
                          ? "echo-of-a-show__standing-rank echo-of-a-show__standing-rank--gold"
                          : "echo-of-a-show__standing-rank"
                    }
                  >
                    {rank}
                  </span>
                  <span className="echo-of-a-show__standing-name">
                    {formatEchoUsername(row.username)}
                  </span>
                  <span className="echo-of-a-show__standing-pts">
                    {row.totalPoints.toLocaleString()}
                  </span>
                </Link>
              )
            })}
          </div>}
        {seasonHref ?
          <Link href={seasonHref} className="echo-of-a-show__standings-more">
            <span>Standings &amp; numbers</span>
            <span className="echo-of-a-show__standings-more-arrow">→</span>
          </Link>
        : null}
      </section>

      <section className="echo-of-a-show__panel echo-of-a-show__remaining">
        <div className="echo-of-a-show__stat-label">Remaining this leg</div>
        {remaining.length === 0 ?
          <p className="echo-of-a-show__empty">No remaining shows this leg.</p>
        : <div className="echo-of-a-show__remaining-list">
            {remaining.map((show) => (
              <Link
                key={show.show_id}
                href={getEchoOfAShowShowUrl(show.show_id)}
                className="echo-of-a-show__remaining-row"
              >
                <span className="echo-of-a-show__remaining-date">
                  {formatEchoMdDate(show.show_date)}
                </span>
                <span className="echo-of-a-show__remaining-place">
                  {show.show_venue_location || show.show_subvenue}
                </span>
                <EchoOfAShowCountdown showTime={show.show_time} compact />
              </Link>
            ))}
          </div>}
      </section>
    </aside>
  )
}
