"use client"

import { EchoOfAShowCountdown } from "@/components/echo-of-a-show/echo-of-a-show-countdown"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import type { SongStat } from "@/hooks/use-setlist-game-show-data"
import type { UserPick } from "@/hooks/use-user-picks"
import {
  echoBestCall,
  echoCloserSong,
  echoOpenerSong,
  echoSetCount,
} from "@/lib/echo-of-a-show-picks"
import { formatEchoOrdinal } from "@/lib/echo-of-a-show"

export function EchoOfAShowShowRail({
  phase,
  showTime,
  totalPlayers,
  loggedIn,
  submitted,
  picks,
  songsPicked,
  songsPlayed,
  score,
  youStanding,
  topSongs,
  onMakePicks,
  onLogin,
  onViewResults,
}: {
  phase: "open" | "closed" | "scored"
  showTime: string
  totalPlayers: number
  loggedIn: boolean
  submitted: boolean
  picks: UserPick[]
  songsPicked: number
  songsPlayed: number
  score: number | null
  youStanding: { rank: number; total: number; songsHit: number } | null
  topSongs: SongStat[]
  onMakePicks: () => void
  onLogin: () => void
  onViewResults: () => void
}) {
  const opener = echoOpenerSong(picks)
  const closer = echoCloserSong(picks)
  const sets = echoSetCount(picks)
  const over =
    songsPlayed > 0 && songsPicked > songsPlayed
      ? (songsPicked - songsPlayed) * 3
      : 0
  const best = echoBestCall(picks)
  const bestShare = best
    ? topSongs.find((stat) => stat.song === best.song)
    : undefined

  if (phase === "scored") {
    return (
      <aside className="echo-of-a-show__rail">
        {loggedIn && score != null ?
          <section className="echo-of-a-show__final">
            <div className="echo-of-a-show__kicker-row">
              <span className="echo-of-a-show__kicker echo-of-a-show__kicker--blue">
                Your final
              </span>
              <span className="echo-of-a-show__status echo-of-a-show__status--done">
                Game completed
              </span>
            </div>
            <div className="echo-of-a-show__final-score">
              <span className="echo-of-a-show__final-num">{score}</span>
              {youStanding ?
                <span className="echo-of-a-show__final-rank">
                  {formatEchoOrdinal(youStanding.rank)} of {youStanding.total}
                </span>
              : null}
            </div>
            <div className="echo-of-a-show__stat-pair">
              <div className="echo-of-a-show__mini-stat">
                <div className="echo-of-a-show__stat-label">Songs ✓</div>
                <div className="echo-of-a-show__mini-val">
                  {youStanding?.songsHit ?? 0}{" "}
                  <span>of {songsPicked || picks.length}</span>
                </div>
              </div>
              <div
                className={
                  over > 0
                    ? "echo-of-a-show__mini-stat echo-of-a-show__mini-stat--neg"
                    : "echo-of-a-show__mini-stat"
                }
              >
                <div className="echo-of-a-show__stat-label">Over-picks</div>
                <div className="echo-of-a-show__mini-val">
                  {over > 0 ? `−${over}` : "0"}
                </div>
              </div>
            </div>
          </section>
        : null}

        {best ?
          <section className="echo-of-a-show__panel echo-of-a-show__panel--pad">
            <div className="echo-of-a-show__stat-label">Your best call</div>
            <div className="echo-of-a-show__best-song">
              {best.song}
              {best.placement ? `, ${best.placement.toLowerCase()}` : ""}
            </div>
            <div className="echo-of-a-show__meta">
              +{best.score ?? 0}
              {bestShare
                ? ` · only ${bestShare.percentage}% of the field put it there`
                : ""}
            </div>
          </section>
        : null}

        {submitted ?
          <button
            type="button"
            className="echo-of-a-show__ghost-btn echo-of-a-show__ghost-btn--block"
            onClick={onViewResults}
          >
            Your picks beside the setlist
          </button>
        : loggedIn ?
          null
        : <button
            type="button"
            className="echo-of-a-show__cta-btn echo-of-a-show__cta-btn--lg echo-of-a-show__ghost-btn--block"
            onClick={onLogin}
          >
            Login to Play
          </button>}
      </aside>
    )
  }

  return (
    <aside className="echo-of-a-show__rail">
      {phase === "open" ?
        <section className="echo-of-a-show__panel echo-of-a-show__panel--pad">
          <div className="echo-of-a-show__stat-label">Picks lock in</div>
          <div className="echo-of-a-show__lock-wide">
            <EchoOfAShowCountdown showTime={showTime} fill />
          </div>
          <div className="echo-of-a-show__meta echo-of-a-show__venue-meta">
            {totalPlayers} {totalPlayers === 1 ? "entry" : "entries"} so far
          </div>
        </section>
      : <section className="echo-of-a-show__closed-note">
          <span className="echo-of-a-show__closed-dot" aria-hidden />
          <span>
            Picks are closed for this show. Check back later to see results after
            the setlist has been scored.
          </span>
        </section>}

      <section
        className={
          submitted
            ? "echo-of-a-show__entry echo-of-a-show__entry--in"
            : "echo-of-a-show__entry"
        }
      >
        <div className="echo-of-a-show__kicker-row">
          <span className="echo-of-a-show__kicker echo-of-a-show__kicker--peach">
            Your entry
          </span>
          <span className="echo-of-a-show__meta">
            {submitted ? "Submitted" : "Not submitted"}
          </span>
        </div>
        {submitted ?
          <div className="echo-of-a-show__entry-stats">
            <div className="echo-of-a-show__entry-row">
              <span>Songs</span>
              <span>
                {picks.length} · {sets} {sets === 1 ? "set" : "sets"}
              </span>
            </div>
            <div className="echo-of-a-show__entry-row">
              <span>Opener · first pick</span>
              <span>
                {opener ?
                  <SongDisplayName song={opener} underlineOnHover={false} />
                : "—"}
              </span>
            </div>
            <div className="echo-of-a-show__entry-row">
              <span>Closer · last pick</span>
              <span>
                {closer ?
                  <SongDisplayName song={closer} underlineOnHover={false} />
                : "—"}
              </span>
            </div>
          </div>
        : <>
            <div className="echo-of-a-show__entry-empty">No setlist yet</div>
            <div className="echo-of-a-show__meta">
              Pick songs, sort them into sets, call the opener and closer.
            </div>
          </>}
        {phase === "open" ?
          <button
            type="button"
            className="echo-of-a-show__cta-btn echo-of-a-show__cta-btn--lg echo-of-a-show__ghost-btn--block"
            onClick={loggedIn ? onMakePicks : onLogin}
          >
            {loggedIn
              ? submitted
                ? "Edit picks"
                : "Build your setlist"
              : "Login to Play"}
          </button>
        : submitted ?
          <button
            type="button"
            className="echo-of-a-show__ghost-btn echo-of-a-show__ghost-btn--block"
            onClick={onViewResults}
          >
            View My Picks
          </button>
        : loggedIn ?
          null
        : <button
            type="button"
            className="echo-of-a-show__cta-btn echo-of-a-show__cta-btn--lg echo-of-a-show__ghost-btn--block"
            onClick={onLogin}
          >
            Login to Play
          </button>}
      </section>

      {phase === "open" ?
        <p className="echo-of-a-show__footnote">
          Edits stay open until one hour before the show&apos;s local start time.
          After that your setlist is sealed and scoring takes over.
        </p>
      : null}
    </aside>
  )
}
