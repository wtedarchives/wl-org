"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

import { SongDisplayName } from "@/components/dpro/song-display-name"
import type { GameShow, SongStat } from "@/hooks/use-setlist-game-show-data"
import type { UserPick } from "@/hooks/use-user-picks"
import {
  formatEchoDotDate,
  formatEchoMdDate,
  formatEchoOrdinal,
} from "@/lib/echo-of-a-show"
import type { EchoActualEntry } from "@/lib/echo-of-a-show-live"
import {
  echoBestCall,
  echoCloserSong,
  echoRevealPickDetail,
  sortEchoPicks,
} from "@/lib/echo-of-a-show-picks"
import {
  echoMarkRevealSeen,
  fetchEchoNextOpenShow,
  fetchEchoSeasonRank,
} from "@/lib/echo-of-a-show-reveal"
import { getEchoOfAShowShowUrl } from "@/lib/echo-of-a-show-url"

type Beat = "sealed" | "counting" | "settled"

type CountLine = {
  key: string
  label: string
  song?: string
  points: string
  hit: boolean
}

const TICK_MS = 220
const FADE_MS = 180

function pickLine(pick: UserPick, index: number): CountLine {
  const missed = pick.result === "not_played" || (pick.score ?? 0) <= 0
  return {
    key: `${pick.set}-${pick.setnum}-${index}`,
    label: echoRevealPickDetail(pick),
    song: pick.song,
    points: missed ? "—" : `+${pick.score ?? 0}`,
    hit: !missed,
  }
}

export function EchoOfAShowReveal({
  show,
  picks,
  score,
  songsPicked,
  songsPlayed,
  playersCount,
  youRank,
  youTotal,
  topSongs,
  actual,
  closerHits,
  userId,
  onSkip,
  onSongBySong,
  onStandings,
}: {
  show: GameShow
  picks: UserPick[]
  score: number
  songsPicked: number
  songsPlayed: number
  playersCount: number
  youRank: number
  youTotal: number
  topSongs: SongStat[]
  actual: EchoActualEntry[]
  closerHits: number
  userId: string
  onSkip: () => void
  onSongBySong: () => void
  onStandings: () => void
}) {
  const [beat, setBeat] = useState<Beat>("sealed")
  const [visible, setVisible] = useState(true)
  const [readCount, setReadCount] = useState(0)
  const [seasonRank, setSeasonRank] = useState<number | null>(null)
  const [nextShow, setNextShow] = useState<{
    show_id: string
    show_date: string
  } | null>(null)

  const sorted = useMemo(() => sortEchoPicks(picks), [picks])
  const extra = Math.max(0, songsPicked - songsPlayed)
  const over = songsPlayed > 0 && extra > 0 ? extra * 3 : 0
  const lines = useMemo(() => {
    const rows = sorted.map(pickLine)
    if (over > 0) {
      rows.push({
        key: "over",
        label: `${extra} extra ${extra === 1 ? "pick" : "picks"}`,
        points: `−${over}`,
        hit: false,
      })
    }
    return rows
  }, [sorted, over, extra])

  const running = useMemo(() => {
    let total = 0
    const n = Math.min(readCount, sorted.length)
    for (let i = 0; i < n; i++) total += sorted[i]?.score ?? 0
    if (readCount > sorted.length && over > 0) total -= over
    return total
  }, [readCount, sorted, over])

  const best = echoBestCall(picks)
  const bestShare = best
    ? topSongs.find((stat) => stat.song === best.song)
    : undefined
  const yourCloser = echoCloserSong(picks)
  const actualLast = actual[actual.length - 1]
  const closerMissed =
    !picks.some((pick) => pick.showcloser_correct) &&
    Boolean(yourCloser && actualLast)
  const venue = show.show_subvenue || show.show_subvenue_venue || "This show"
  const closerCopy =
    closerHits === 0
      ? "Nobody called the closer."
      : closerHits === 1
        ? "One of them called the closer."
        : `${closerHits} of them called the closer.`
  const shownLines = lines.slice(Math.max(0, readCount - 3), readCount)
  const playedCount = songsPlayed || actual.length

  useEffect(() => {
    let cancelled = false
    void fetchEchoSeasonRank(show.show_tour, userId).then((rank) => {
      if (!cancelled) setSeasonRank(rank)
    })
    void fetchEchoNextOpenShow(show.show_tour, show.show_id).then((next) => {
      if (!cancelled) setNextShow(next)
    })
    return () => {
      cancelled = true
    }
  }, [show.show_id, show.show_tour, userId])

  useEffect(() => {
    if (beat !== "counting") return
    if (readCount >= lines.length) {
      let fade = 0
      const done = window.setTimeout(() => {
        setVisible(false)
        fade = window.setTimeout(() => {
          echoMarkRevealSeen(userId, show.show_id)
          setBeat("settled")
          setVisible(true)
        }, FADE_MS)
      }, 500)
      return () => {
        window.clearTimeout(done)
        window.clearTimeout(fade)
      }
    }
    const tick = window.setTimeout(() => setReadCount((n) => n + 1), TICK_MS)
    return () => window.clearTimeout(tick)
  }, [beat, readCount, lines.length, userId, show.show_id])

  function go(next: Beat) {
    setVisible(false)
    window.setTimeout(() => {
      if (next === "counting") setReadCount(1)
      if (next === "settled") echoMarkRevealSeen(userId, show.show_id)
      setBeat(next)
      setVisible(true)
    }, FADE_MS)
  }

  function skip() {
    echoMarkRevealSeen(userId, show.show_id)
    onSkip()
  }

  return (
    <div
      className={
        visible ? "echo-reveal echo-reveal--in" : "echo-reveal echo-reveal--out"
      }
    >
      {beat === "sealed" ?
        <>
          <span className="echo-of-a-show__status echo-of-a-show__status--done">
            Scored
          </span>
          <h1 className="echo-reveal__headline">{venue} is in the books.</h1>
          <p className="echo-of-a-show__meta">
            {[
              formatEchoDotDate(show.show_date),
              show.show_venue_location,
              playedCount ? `${playedCount} songs` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <section className="echo-reveal__sealed">
            <div className="echo-of-a-show__stat-label">Your final score</div>
            <div className="echo-reveal__dots" aria-hidden>
              ●●●
            </div>
            <p className="echo-reveal__sealed-meta">
              {playersCount} {playersCount === 1 ? "player" : "players"}.{" "}
              {closerCopy}
            </p>
          </section>
          <button
            type="button"
            className="echo-of-a-show__cta-btn echo-of-a-show__cta-btn--lg echo-of-a-show__ghost-btn--block"
            onClick={() => go("counting")}
          >
            Reveal
          </button>
          <button type="button" className="echo-reveal__skip" onClick={skip}>
            Skip to standings
          </button>
        </>
      : beat === "counting" ?
        <>
          <section className="echo-reveal__count">
            <div className="echo-of-a-show__stat-label">Counting</div>
            <div className="echo-run__score">
              <span className="echo-run__score-num">{running}</span>
              <span className="echo-reveal__count-meta">
                {Math.min(readCount, sorted.length)} of {sorted.length} picks
                read
              </span>
            </div>
            <div
              className="echo-reveal__bar"
              style={{
                ["--echo-bar" as string]: String(
                  lines.length > 0 ? Math.min(1, readCount / lines.length) : 0,
                ),
              }}
            >
              <span className="echo-reveal__bar-fill" />
              <span className="echo-reveal__bar-mark" />
            </div>
            <ul className="echo-reveal__ticks">
              {shownLines.map((line) => (
                <li key={line.key}>
                  <span>
                    {line.song ?
                      <>
                        <SongDisplayName
                          song={line.song}
                          underlineOnHover={false}
                        />
                        {` · ${line.label}`}
                      </>
                    : line.label}
                  </span>
                  <span className={line.hit ? "echo-reveal__hit" : undefined}>
                    {line.points}
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <p className="echo-reveal__reading">Reading your picks…</p>
        </>
      : <>
          <section className="echo-reveal__final">
            <div className="echo-of-a-show__stat-label">
              Final · {formatEchoMdDate(show.show_date)}{" "}
              {show.show_venue_location}
            </div>
            <div className="echo-run__score">
              <span className="echo-run__score-num">{score}</span>
              <span className="echo-run__score-label">points</span>
            </div>
            <div className="echo-run__pair">
              {youRank > 0 ?
                <div className="echo-run__rank">
                  <div className="echo-of-a-show__stat-label">Finished</div>
                  <div className="echo-run__rank-val">
                    {formatEchoOrdinal(youRank)}{" "}
                    <span>of {youTotal || playersCount}</span>
                  </div>
                </div>
              : null}
              {seasonRank != null ?
                <div className="echo-run__rank">
                  <div className="echo-of-a-show__stat-label">Season</div>
                  <div className="echo-run__rank-val">
                    {formatEchoOrdinal(seasonRank)}
                  </div>
                </div>
              : null}
            </div>
          </section>

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

          {over > 0 || closerMissed ?
            <section className="echo-reveal__cost">
              <div className="echo-reveal__cost-label">What cost you</div>
              <p>
                {over > 0 ?
                  <>
                    {extra} {extra === 1 ? "pick" : "picks"} past the{" "}
                    {songsPlayed} played: <span>−{over}</span>
                    {closerMissed ? ". " : "."}
                  </>
                : null}
                {closerMissed ?
                  <>
                    {yourCloser} as show closer: <span>missed</span>
                    {actualLast ? ` — ${actualLast.entry_song} took it.` : "."}
                  </>
                : null}
              </p>
            </section>
          : null}

          <div className="echo-reveal__actions">
            <button
              type="button"
              className="echo-of-a-show__ghost-btn"
              onClick={onSongBySong}
            >
              Song by song
            </button>
            <button
              type="button"
              className="echo-of-a-show__ghost-btn"
              onClick={() => {
                echoMarkRevealSeen(userId, show.show_id)
                onStandings()
              }}
            >
              Standings
            </button>
          </div>
          {nextShow ?
            <Link
              href={getEchoOfAShowShowUrl(nextShow.show_id)}
              className="echo-of-a-show__cta-btn echo-of-a-show__cta-btn--lg echo-of-a-show__ghost-btn--block"
            >
              Picks for {formatEchoMdDate(nextShow.show_date)} →
            </Link>
          : null}
        </>}
    </div>
  )
}
