"use client"

import { Check } from "@phosphor-icons/react"

import type { EchoLiveStandingRow } from "@/hooks/use-echo-live-standings"
import { echoTourSurfaceBgStyle } from "@/lib/echo-tour-surface-bg"

function formatSongsCorrect(count: number): string {
  return count === 1 ? "1 song correct" : `${count} songs correct`
}

export function EchoLiveStandingsCard({
  standings,
  loading,
  picksOpen,
  onViewUser,
}: {
  standings: EchoLiveStandingRow[]
  loading: boolean
  picksOpen: boolean
  onViewUser: (userId: string, username: string) => void
}) {
  return (
    <div
      className="echo-live-card echo-live-show-standings"
      style={echoTourSurfaceBgStyle("live-standings")}
    >
      <h2 className="echo-live-card-title echo-live-standings-title">
        Show standings
      </h2>
      {loading && standings.length === 0 ?
        <p className="echo-live-empty">Loading standings…</p>
      : standings.length === 0 ?
        <p className="echo-live-empty">No standings available yet.</p>
      : <div className="echo-live-standings-scroll">
          <div className="echo-live-standings">
            {standings.map((row) => (
              <div
                key={row.userId}
                className="echo-live-standing"
                data-me={row.isMe ? "true" : undefined}
              >
                <span className="echo-live-standing-rank">{row.rank}</span>
                {picksOpen ?
                  <span className="echo-live-standing-name">{row.username}</span>
                : <button
                    type="button"
                    className="echo-live-standing-name echo-live-standing-user"
                    onClick={() => onViewUser(row.userId, row.username)}
                  >
                    {row.username}
                  </button>}
                <div className="echo-live-standing-pills">
                  {row.showOpenerPicked ?
                    <span className="echo-live-standing-pill">
                      <Check size={12} weight="bold" aria-hidden />
                      show opener
                    </span>
                  : null}
                  {row.showCloserPicked ?
                    <span className="echo-live-standing-pill">
                      <Check size={12} weight="bold" aria-hidden />
                      show closer
                    </span>
                  : null}
                </div>
                <span className="echo-live-standing-songs">
                  {formatSongsCorrect(row.songsCorrect)}
                </span>
                <span className="echo-live-standing-pts">{row.totalPoints}</span>
              </div>
            ))}
          </div>
        </div>}
    </div>
  )
}
