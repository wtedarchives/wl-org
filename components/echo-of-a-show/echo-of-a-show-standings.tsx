"use client"

import { Check, X } from "lucide-react"

import type { PlayerStats } from "@/hooks/use-setlist-game-show-data"
import { formatEchoUsername } from "@/lib/echo-of-a-show"

export function EchoOfAShowStandings({
  standings,
  userId,
  totalPlayers,
  onViewUser,
}: {
  standings: PlayerStats[]
  userId?: string
  totalPlayers: number
  onViewUser: (userId: string, username: string) => void
}) {
  return (
    <section className="echo-of-a-show__panel">
      <div className="echo-of-a-show__standings-head">
        <span className="echo-of-a-show__stat-label">Show standings</span>
        <span className="echo-of-a-show__meta">
          {totalPlayers} {totalPlayers === 1 ? "user" : "users"} playing · game
          completed
        </span>
      </div>
      {standings.length === 0 ?
        <p className="echo-of-a-show__empty echo-of-a-show__empty--inset">
          No standings available yet.
        </p>
      : <div className="echo-of-a-show__table-scroll">
          <table className="echo-of-a-show__table">
            <thead>
              <tr>
                <th>Rank</th>
                <th className="echo-of-a-show__table-user">User</th>
                <th>Total Points</th>
                <th>Songs Picked</th>
                <th>Sets Picked</th>
                <th>Show Opener</th>
                <th>Show Closer</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, index) => {
                const isYou = Boolean(userId && row.userId === userId)
                return (
                  <tr
                    key={row.userId}
                    className={isYou ? "echo-of-a-show__table-row--you" : undefined}
                  >
                    <td className={isYou ? "echo-of-a-show__td-you" : undefined}>
                      {index + 1}
                    </td>
                    <td className="echo-of-a-show__table-user">
                      <button
                        type="button"
                        className="echo-of-a-show__user-btn"
                        onClick={() => onViewUser(row.userId, row.username)}
                      >
                        {formatEchoUsername(row.username)}
                      </button>
                    </td>
                    <td className="echo-of-a-show__td-pts">{row.totalPoints}</td>
                    <td>{row.songsPicked}</td>
                    <td>{row.setsPicked}</td>
                    <td>
                      <Mark ok={row.showOpenerPicked} />
                    </td>
                    <td>
                      <Mark ok={row.showCloserPicked} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>}
    </section>
  )
}

function Mark({ ok }: { ok: boolean }) {
  return (
    <span
      className={
        ok
          ? "echo-of-a-show__mark echo-of-a-show__mark--yes"
          : "echo-of-a-show__mark echo-of-a-show__mark--no"
      }
    >
      {ok ?
        <Check size={14} strokeWidth={2.5} aria-label="Yes" />
      : <X size={14} strokeWidth={2.5} aria-label="No" />}
    </span>
  )
}
