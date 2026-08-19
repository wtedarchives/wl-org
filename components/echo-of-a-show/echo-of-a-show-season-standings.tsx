"use client"

import Link from "next/link"

import type { TourPlayerStats } from "@/hooks/use-setlist-game-tour-details"
import { formatEchoUsername } from "@/lib/echo-of-a-show"
import { getUserProfileUrl } from "@/lib/user-profile-url"

export function EchoOfAShowSeasonStandings({
  standings,
  userId,
}: {
  standings: TourPlayerStats[]
  userId?: string
}) {
  if (standings.length === 0) {
    return (
      <p className="echo-of-a-show__empty echo-of-a-show__empty--inset">
        Standings appear after the first scored show.
      </p>
    )
  }

  return (
    <div className="echo-of-a-show__table-scroll echo-season__standings">
      <table className="echo-of-a-show__table">
        <thead>
          <tr>
            <th className="echo-season__th-rank">#</th>
            <th className="echo-of-a-show__table-user">Player</th>
            <th>Points</th>
            <th className="echo-season__col-wide">Shows</th>
            <th>Per show</th>
            <th className="echo-season__col-wide">Songs</th>
            <th className="echo-season__col-wide">Sets</th>
            <th className="echo-season__col-wide">Openers</th>
            <th className="echo-season__col-wide">Closers</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, index) => {
            const rank = index + 1
            const isYou = Boolean(userId && row.userId === userId)
            return (
              <tr
                key={row.userId}
                className={isYou ? "echo-of-a-show__table-row--you" : undefined}
              >
                <td
                  className={
                    isYou
                      ? "echo-of-a-show__td-you"
                      : rank === 1
                        ? "echo-season__td-gold"
                        : undefined
                  }
                >
                  {rank}
                </td>
                <td className="echo-of-a-show__table-user">
                  <Link
                    href={getUserProfileUrl(row.userId)}
                    className="echo-of-a-show__user-btn"
                  >
                    {formatEchoUsername(row.username)}
                  </Link>
                </td>
                <td className="echo-of-a-show__td-pts">
                  {row.totalPoints.toLocaleString()}
                </td>
                <td className="echo-season__col-wide">{row.showsPlayed}</td>
                <td className="echo-season__td-muted">
                  {row.avgPointsPerShow.toFixed(1)}
                </td>
                <td className="echo-season__col-wide">{row.songsPicked}</td>
                <td className="echo-season__col-wide">{row.setsPicked}</td>
                <td className="echo-season__col-wide">
                  {row.showOpenersPicked}
                </td>
                <td className="echo-season__col-wide">
                  {row.showClosersPicked}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
