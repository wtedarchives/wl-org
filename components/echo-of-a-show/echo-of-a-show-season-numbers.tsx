"use client"

import Link from "next/link"

import type { TourGameShow } from "@/hooks/use-setlist-game-tour-details"
import {
  formatEchoDotDate,
  formatEchoMdDate,
} from "@/lib/echo-of-a-show"
import { getEchoOfAShowShowUrl } from "@/lib/echo-of-a-show-url"
import { formatOverUnderValue } from "@/lib/setlist-game-utils"

function dashOr(scored: boolean, value: string | number | undefined) {
  if (!scored || value === undefined || value === "") {
    return <span className="echo-season__dash">—</span>
  }
  return value
}

function overUnderCell(show: TourGameShow) {
  const scored = Boolean(show.show_scored)
  const raw = formatOverUnderValue(show.averageOverUnder, scored)
  if (!raw) return <span className="echo-season__dash">—</span>
  const tone =
    show.averageOverUnder != null && show.averageOverUnder > 0
      ? "echo-season__ou echo-season__ou--pos"
      : show.averageOverUnder != null && show.averageOverUnder < 0
        ? "echo-season__ou echo-season__ou--neg"
        : "echo-season__ou"
  return <span className={tone}>{raw.replace("-", "−")}</span>
}

export function EchoOfAShowSeasonNumbers({
  gameShows,
}: {
  gameShows: TourGameShow[]
}) {
  if (gameShows.length === 0) {
    return (
      <section className="echo-of-a-show__panel">
        <p className="echo-of-a-show__empty echo-of-a-show__empty--inset">
          No show numbers yet.
        </p>
      </section>
    )
  }

  return (
    <div className="echo-season__nums">
      <p className="echo-season__nums-hint">12 columns · swipe →</p>
      <section className="echo-of-a-show__panel echo-season__nums-frame">
        <div className="echo-of-a-show__table-scroll echo-season__nums-scroll">
          <table className="echo-of-a-show__table echo-season__num-table">
            <thead>
              <tr>
                <th className="echo-season__num-date">Date</th>
                <th className="echo-season__num-place">Location</th>
                <th>Players</th>
                <th>High</th>
                <th>Avg</th>
                <th>Avg +/− picks</th>
                <th>Songs ✓</th>
                <th>Avg songs ✓</th>
                <th>Sets ✓</th>
                <th>Avg sets ✓</th>
                <th>Opener picks</th>
                <th>Closer picks</th>
              </tr>
            </thead>
            <tbody>
              {gameShows.map((show) => {
                const scored = Boolean(show.show_scored)
                return (
                  <tr key={show.show_id}>
                    <td className="echo-season__num-date">
                      <Link
                        href={getEchoOfAShowShowUrl(show.show_id)}
                        className="echo-season__date-link"
                      >
                        <span className="echo-season__date-full">
                          {formatEchoDotDate(show.show_date)}
                        </span>
                        <span className="echo-season__date-short">
                          {formatEchoMdDate(show.show_date)}
                        </span>
                      </Link>
                    </td>
                    <td className="echo-season__num-place">
                      {show.show_venue_location || "—"}
                    </td>
                    <td>{show.playerCount ?? 0}</td>
                    <td>{dashOr(scored, show.highScore)}</td>
                    <td>
                      {dashOr(
                        scored,
                        show.averageScore != null
                          ? show.averageScore.toFixed(2)
                          : undefined,
                      )}
                    </td>
                    <td>{overUnderCell(show)}</td>
                    <td>{dashOr(scored, show.totalCorrectSongs)}</td>
                    <td>
                      {dashOr(
                        scored,
                        show.averageCorrectSongs != null
                          ? show.averageCorrectSongs.toFixed(2)
                          : undefined,
                      )}
                    </td>
                    <td>{dashOr(scored, show.totalCorrectSets)}</td>
                    <td>
                      {dashOr(
                        scored,
                        show.averageCorrectSets != null
                          ? show.averageCorrectSets.toFixed(2)
                          : undefined,
                      )}
                    </td>
                    <td>{dashOr(scored, show.usersPickedOpener)}</td>
                    <td>{dashOr(scored, show.usersPickedCloser)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
