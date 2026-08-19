"use client"

import { useEffect, useState } from "react"

import { useAuth } from "@/components/auth-context"
import type { GameShow } from "@/hooks/use-game-shows"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import {
  formatEchoCompactRemaining,
  formatEchoDotDate,
  getEchoLockCountdown,
} from "@/lib/echo-of-a-show"
import {
  convertFromEasternToUTC,
  convertToEasternDisplay,
} from "@/lib/utils/show-utils"

function statusOf(show: GameShow): "open" | "closed" | "scored" {
  if (show.show_scored) return "scored"
  if (show.isSelectionClosed) return "closed"
  return "open"
}

export function EchoOfAShowScoreTable({
  shows,
  songCounts,
  runningId,
  busy,
  pendingId,
  onRecalc,
  onScore,
  onTimeSaved,
}: {
  shows: GameShow[]
  songCounts: Record<string, number>
  runningId: string | null
  busy: boolean
  pendingId: string | null
  onRecalc: (showId: string) => void
  onScore: (showId: string) => void
  onTimeSaved: () => void
}) {
  return (
    <div className="echo-score__table-wrap">
      <div className="echo-score__table-head">Shows in this league</div>
      <div className="echo-of-a-show__table-scroll">
        <table className="echo-score__table">
          <thead>
            <tr>
              <th>Show</th>
              <th>Entries</th>
              <th>Songs in</th>
              <th>Status</th>
              <th>Show time (ET)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {shows.map((show) => {
              const songs = songCounts[show.show_id] ?? 0
              const phase = statusOf(show)
              const countdown = getEchoLockCountdown(show.show_time)
              const running = show.show_id === runningId
              const venue =
                show.show_subvenue || show.show_subvenue_venue || "Show"
              return (
                <tr
                  key={show.show_id}
                  className={running ? "echo-score__row--run" : undefined}
                >
                  <td>
                    <span className="echo-score__date">
                      {formatEchoDotDate(show.show_date)}
                    </span>
                    <span className="echo-score__place">
                      {venue}
                      {show.show_venue_location
                        ? ` · ${show.show_venue_location}`
                        : ""}
                    </span>
                  </td>
                  <td>{show.playerCount ?? 0}</td>
                  <td>
                    {songs > 0 ?
                      songs
                    : phase === "open" ?
                      "—"
                    : 0}
                  </td>
                  <td>
                    <span
                      className={
                        phase === "scored"
                          ? "echo-of-a-show__status echo-of-a-show__status--done"
                          : phase === "closed"
                            ? "echo-of-a-show__status echo-of-a-show__status--closed"
                            : "echo-of-a-show__status echo-of-a-show__status--open"
                      }
                    >
                      {phase === "scored"
                        ? "Scored"
                        : phase === "closed"
                          ? "Closed"
                          : `${formatEchoCompactRemaining(countdown)} left`}
                    </span>
                  </td>
                  <td>
                    <EchoScoreTimeCell show={show} onSaved={onTimeSaved} />
                  </td>
                  <td>
                    {phase === "scored" ?
                      <span className="echo-score__muted">
                        Scored — not in the list
                      </span>
                    : <span className="echo-score__actions">
                        <button
                          type="button"
                          className="echo-score__btn echo-score__btn--recalc"
                          disabled={busy || phase === "open"}
                          onClick={() => onRecalc(show.show_id)}
                        >
                          {busy && pendingId === show.show_id
                            ? "Working…"
                            : "Recalc now"}
                        </button>
                        <button
                          type="button"
                          className="echo-score__btn echo-score__btn--score"
                          disabled={busy || phase === "open"}
                          onClick={() => onScore(show.show_id)}
                        >
                          {busy && pendingId === show.show_id
                            ? "Scoring…"
                            : "Score submissions"}
                        </button>
                      </span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="echo-score__foot">
        Same scoring operation as today, in the table, with the show-time field
        from the picks column. A scored show stays listed but drops out of
        scoring.
      </p>
    </div>
  )
}

function EchoScoreTimeCell({
  show,
  onSaved,
}: {
  show: GameShow
  onSaved: () => void
}) {
  const { session } = useAuth()
  const [draft, setDraft] = useState(() =>
    convertToEasternDisplay(show.show_time ?? null),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDraft(convertToEasternDisplay(show.show_time ?? null))
    setError(null)
  }, [show.show_id, show.show_time])

  const dirty = draft !== convertToEasternDisplay(show.show_time ?? null)

  async function save() {
    if (!dirty || !session?.token) return
    setSaving(true)
    setError(null)
    try {
      const trimmed = draft.trim()
      let payload: string | null = null
      if (trimmed) {
        const utc = convertFromEasternToUTC(trimmed)
        if (!utc) {
          setError("Invalid date/time")
          return
        }
        payload = utc
      }
      const { error: fnErr } = await invokeDproAdmin(session.token, {
        action: "shows_update",
        show_id: show.show_id,
        patch: { show_time: payload },
      })
      if (fnErr) throw new Error(fnErr)
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <span className="echo-score__time">
      <input
        type="datetime-local"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        aria-label="Show time (Eastern)"
        className="echo-score__time-input"
      />
      <button
        type="button"
        className="echo-score__btn echo-score__btn--save"
        disabled={!dirty || saving || !session}
        onClick={() => void save()}
      >
        {saving ? "…" : "Save"}
      </button>
      {error ?
        <span className="echo-score__time-err">{error}</span>
      : null}
    </span>
  )
}
