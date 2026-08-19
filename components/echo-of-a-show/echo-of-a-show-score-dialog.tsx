"use client"

import { useEffect, useId, useMemo, useState } from "react"

import { EchoOfAShowScoreTable } from "@/components/echo-of-a-show/echo-of-a-show-score-table"
import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import {
  useEchoLiveBoard,
  useEchoRunningShow,
} from "@/hooks/use-echo-live-board"
import type { GameShow } from "@/hooks/use-game-shows"
import { useSetlistScoring } from "@/hooks/use-setlist-scoring"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import {
  fetchEchoEntryCounts,
} from "@/lib/echo-of-a-show-admin"
import {
  ECHO_ACTIVE_LEAGUE,
  formatEchoMdDate,
} from "@/lib/echo-of-a-show"

import "./echo-of-a-show.css"

const CLOSE_MS = 220

function sortLeagueShows(
  shows: GameShow[],
  runningId: string | null,
): GameShow[] {
  const rank = (show: GameShow) => {
    if (show.show_id === runningId) return 0
    if (show.isSelectionClosed && !show.show_scored) return 1
    if (show.show_scored) return 2
    return 3
  }
  return [...shows].sort((a, b) => {
    const diff = rank(a) - rank(b)
    if (diff !== 0) return diff
    const aCanon = Number(a.show_canonid)
    const bCanon = Number(b.show_canonid)
    if (rank(a) <= 2) return bCanon - aCanon
    return aCanon - bCanon
  })
}

export function EchoOfAShowScoreDialog({
  open,
  onOpenChange,
  gameShows,
  onRefresh,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameShows: GameShow[]
  onRefresh: () => void | Promise<void>
}) {
  const headingId = useId()
  const [shown, setShown] = useState(open)
  const [songCounts, setSongCounts] = useState<Record<string, number>>({})
  const [pendingId, setPendingId] = useState<string | null>(null)
  const { isScoring, scoringComplete, scoringError, scoreSubmissions, recalcShow } =
    useSetlistScoring()
  const runningShow = useEchoRunningShow(gameShows)
  const { board } = useEchoLiveBoard(open ? runningShow?.show_id : undefined, undefined)

  useWlHomeV2ScrollLock(open)

  useEffect(() => {
    if (open) {
      setShown(true)
      return
    }
    const timer = window.setTimeout(() => setShown(false), CLOSE_MS)
    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  const showIds = useMemo(
    () => gameShows.map((show) => show.show_id).join(","),
    [gameShows],
  )

  useEffect(() => {
    if (!open) return
    const ids = showIds.length > 0 ? showIds.split(",") : []
    let cancelled = false
    void fetchEchoEntryCounts(ids).then((counts) => {
      if (!cancelled) setSongCounts(counts)
    })
    return () => {
      cancelled = true
    }
  }, [open, showIds])

  useEffect(() => {
    if (!open || !runningShow) return
    setSongCounts((prev) => ({
      ...prev,
      [runningShow.show_id]: board.actual.length,
    }))
  }, [open, runningShow, board.actual.length])

  const rows = useMemo(
    () => sortLeagueShows(gameShows, runningShow?.show_id ?? null),
    [gameShows, runningShow?.show_id],
  )

  const leader = board.scores.reduce(
    (max, row) => Math.max(max, row.score),
    0,
  )

  async function refreshAll() {
    await onRefresh()
    const ids = gameShows.map((show) => show.show_id)
    setSongCounts(await fetchEchoEntryCounts(ids))
  }

  async function onRecalc(showId: string) {
    setPendingId(showId)
    await recalcShow(showId)
    setPendingId(null)
    await refreshAll()
  }

  async function onScore(showId: string) {
    setPendingId(showId)
    await scoreSubmissions(showId, () => {
      void refreshAll()
    })
    setPendingId(null)
  }

  if (!shown) return null

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className={open ? "modal-backdrop open" : "modal-backdrop"}
        role="presentation"
        onClick={(event) => {
          if (event.target === event.currentTarget) onOpenChange(false)
        }}
      >
        <div
          className="modal modal--wted-request echo-of-a-show-score"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          onClick={(event) => event.stopPropagation()}
        >
          <header className="echo-score__head">
            <div className="echo-score__head-text">
              <h3 id={headingId}>Score Show</h3>
              <p>
                {ECHO_ACTIVE_LEAGUE} · show times in ET
              </p>
            </div>
            <div className="echo-score__head-end">
              <span className="echo-score__new">on</span>
              <span className="echo-score__toggle-label">
                Recalc on setlist add / remove
              </span>
              <button
                type="button"
                className="modal-request-close"
                onClick={() => onOpenChange(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </header>

          <div className="echo-score__body">
            <EchoOfAShowScoreTable
              shows={rows}
              songCounts={songCounts}
              runningId={runningShow?.show_id ?? null}
              busy={isScoring}
              pendingId={pendingId}
              onRecalc={(showId) => void onRecalc(showId)}
              onScore={(showId) => void onScore(showId)}
              onTimeSaved={() => void refreshAll()}
            />

            <aside className="echo-score__rail">
              {runningShow ?
                <section className="echo-score__card echo-score__card--run">
                  <div className="echo-score__card-kicker">
                    Running · {formatEchoMdDate(runningShow.show_date)}
                    <span className="echo-score__new">new</span>
                  </div>
                  <div className="echo-score__stat">
                    <span>Last recalc</span>
                    <span>
                      {board.actual.length > 0
                        ? `on entry ${board.actual.length}`
                        : "—"}
                    </span>
                  </div>
                  <div className="echo-score__stat">
                    <span>Entries scored</span>
                    <span>{board.scores.length || runningShow.playerCount || 0}</span>
                  </div>
                  <div className="echo-score__stat">
                    <span>Leader</span>
                    <span>{board.scores.length > 0 ? leader : "—"}</span>
                  </div>
                  <p className="echo-score__note">
                    Provisional pass: show-closer bonus and the −3 extra-song
                    penalty are held back until you score the show.
                  </p>
                </section>
              : null}

              <section className="echo-score__card">
                <div className="echo-score__card-kicker">
                  Score submissions does
                </div>
                <p>
                  Recalculates every submission for that show, applies the
                  show-closer bonus and the extra-song penalty, marks the show
                  scored, and refreshes. Unchanged from today — a scored show
                  drops out of scoring.
                </p>
              </section>

              <section className="echo-score__card">
                <div className="echo-score__card-kicker">Reminder</div>
                <p>
                  Rules say a show is scored once a recording is available.
                  Running recalc only makes sense if someone enters the setlist
                  during the show.
                </p>
              </section>

              {scoringError ?
                <p className="echo-score__err" role="alert">
                  {scoringError}
                </p>
              : null}
              {scoringComplete ?
                <p className="echo-score__ok">Scored. Standings will refresh.</p>
              : null}
            </aside>
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
