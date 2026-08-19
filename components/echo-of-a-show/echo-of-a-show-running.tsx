"use client"

import Link from "next/link"

import type { UserPick } from "@/hooks/use-user-picks"
import { formatEchoMdDate, formatEchoOrdinal } from "@/lib/echo-of-a-show"
import {
  echoLastSongDelta,
  echoLiveSetLabel,
  echoProvisionalRank,
  type EchoActualEntry,
} from "@/lib/echo-of-a-show-live"
import { getEchoOfAShowShowUrl } from "@/lib/echo-of-a-show-url"

export function EchoOfAShowRunning({
  show,
  actual,
  picks,
  youScore,
  scores,
  userId,
  linkLastSong = true,
  onRecalc,
  recalcPending,
}: {
  show: {
    show_id: string
    show_date: string
    show_subvenue: string
    show_subvenue_venue?: string
    show_venue_location: string
    playerCount?: number
  }
  actual: EchoActualEntry[]
  picks: UserPick[]
  youScore: number
  scores: { userId: string; score: number }[]
  userId?: string
  linkLastSong?: boolean
  onRecalc?: () => void
  recalcPending?: boolean
}) {
  const last = echoLastSongDelta(picks, actual)
  const rank = echoProvisionalRank(
    scores.map((row) => row.score),
    youScore,
  )
  const leader = scores.reduce((max, row) => Math.max(max, row.score), 0)
  const ratio = leader > 0 ? Math.min(1, youScore / leader) : 0
  const venue = show.show_subvenue || show.show_subvenue_venue || "Show"
  const place = [formatEchoMdDate(show.show_date), venue, show.show_venue_location]
    .filter(Boolean)
    .join(" · ")
  const lastInner = (
    <>
      <span className="echo-of-a-show__stat-label">Last song</span>
      <span className="echo-run__last-val">
        {last == null ? "—" : last.score == null ? "—" : `+${last.score}`}
        {last?.name ?
          <span className="echo-run__last-song">{last.name}</span>
        : null}
      </span>
      {linkLastSong ?
        <span className="echo-run__last-hint">Tap for song-by-song</span>
      : null}
    </>
  )

  return (
    <section className="echo-of-a-show__panel echo-of-a-show__panel--running">
      <div className="echo-of-a-show__kicker-row">
        <span className="echo-of-a-show__kicker">Running score</span>
        <span className="echo-of-a-show__status echo-of-a-show__status--live">
          {echoLiveSetLabel(actual)}
        </span>
      </div>
      <div className="echo-of-a-show__meta echo-of-a-show__venue-meta">{place}</div>
      <div className="echo-run__score">
        <span className="echo-run__score-num">{youScore}</span>
        <span className="echo-run__score-label">points</span>
      </div>
      <div className="echo-run__pair">
        {linkLastSong ?
          <Link
            href={getEchoOfAShowShowUrl(show.show_id)}
            className="echo-run__last"
          >
            {lastInner}
          </Link>
        : <div className="echo-run__last echo-run__last--static">{lastInner}</div>}
        <div className="echo-run__rank">
          <div className="echo-of-a-show__stat-label">Rank</div>
          <div className="echo-run__rank-val">
            {formatEchoOrdinal(rank)}{" "}
            <span>of {scores.length || show.playerCount || 0}</span>
          </div>
        </div>
      </div>
      <div className="echo-run__bar-meta">
        <span>You {youScore}</span>
        <span>Leader {leader}</span>
      </div>
      <div
        className="echo-run__bar"
        style={{ ["--echo-bar" as string]: String(ratio) }}
      >
        <span className="echo-run__bar-fill" />
      </div>
      {onRecalc ?
        <button
          type="button"
          className="echo-run__recalc"
          onClick={onRecalc}
          disabled={recalcPending}
        >
          {recalcPending ? "Recalculating…" : "Recalc now"}
        </button>
      : userId ? null : (
        <p className="echo-of-a-show__meta echo-of-a-show__venue-meta">
          Log in to see your running score.
        </p>
      )}
    </section>
  )
}
