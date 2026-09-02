"use client"

import Link from "next/link"

import { useShowStatistics } from "@/hooks/use-show-statistics"
import { getEchoLiveShowUrl } from "@/lib/echo-archive-url"
import { echoTourSurfaceBgStyle } from "@/lib/echo-tour-surface-bg"
import {
  formatOverUnderValue,
} from "@/lib/setlist-game-utils"
import { cn } from "@/lib/utils"

import { ECHO_ACTIVE_LEAGUE } from "./echo-tour-data"

function formatMmDd(dateInput: string): string {
  const date = new Date(
    dateInput.includes("T") ? dateInput : `${dateInput}T00:00:00Z`,
  )
  if (Number.isNaN(date.getTime())) return ""
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  return `${month}.${day}`
}

function overUnderClass(
  averageOverUnder: number | undefined,
  showScored: boolean,
): string | undefined {
  if (!showScored || averageOverUnder === undefined) return undefined
  if (averageOverUnder > 0) return "is-positive"
  if (averageOverUnder < 0) return "is-negative"
  return undefined
}

const STAT_COLUMNS = [
  { key: "date", label: "Date", align: "center" },
  { key: "location", label: "Location", align: "left" },
  { key: "players", label: "Players", align: "center" },
  { key: "high", label: "High score", align: "center" },
  { key: "avg", label: "Avg score", align: "center" },
  { key: "overunder", label: "Avg +/- picks", align: "center" },
  { key: "totalSongs", label: "Total songs correct", align: "center" },
  { key: "avgSongs", label: "Avg songs correct", align: "center" },
  { key: "totalSets", label: "Total sets correct", align: "center" },
  { key: "avgSets", label: "Avg sets correct", align: "center" },
  { key: "openers", label: "Opener picks", align: "center" },
  { key: "closers", label: "Closer picks", align: "center" },
] as const

export function EchoTourShowStatistics() {
  const { showStatsLoading, showsWithStats } = useShowStatistics(
    ECHO_ACTIVE_LEAGUE,
  )

  return (
    <section
      className="echo-tour-show-stats"
      aria-labelledby="echo-tour-show-stats-heading"
    >
      <div
        className="echo-tour-shows-list echo-tour-show-stats-panel"
        style={echoTourSurfaceBgStyle("show-stats")}
      >
        <h2 className="echo-tour-shows-title" id="echo-tour-show-stats-heading">
          Show statistics
        </h2>
        {showStatsLoading ?
          <div className="echo-tour-shows-empty">Loading show statistics…</div>
        : showsWithStats.length === 0 ?
          <div className="echo-tour-shows-empty">
            No shows found for this tour.
          </div>
        : <div
            className="echo-tour-show-stats-scroll"
            role="region"
            aria-labelledby="echo-tour-show-stats-heading"
          >
            <table className="echo-tour-show-stats-table">
              <colgroup>
                <col className="echo-tour-show-stats-col-date" />
                <col className="echo-tour-show-stats-col-location" />
                <col className="echo-tour-show-stats-col-players" />
                <col className="echo-tour-show-stats-col-metric" span={9} />
              </colgroup>
              <thead className="echo-tour-show-stats-head">
                <tr>
                  {STAT_COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      scope="col"
                      className={cn(
                        col.align === "center" && "is-center",
                        col.align === "left" && "is-left",
                      )}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {showsWithStats.map((show) => (
                  <tr key={show.show_id} className="echo-tour-show-stats-row">
                    <td className="echo-tour-show-stats-date is-center">
                      <Link
                        href={getEchoLiveShowUrl(show.show_id)}
                        className="echo-tour-show-date-link"
                        scroll={false}
                      >
                        {formatMmDd(show.show_date)}
                      </Link>
                    </td>
                    <td className="is-muted">
                      {show.show_venue_location}
                    </td>
                    <td className="is-center is-muted">
                      {show.playerCount ?? ""}
                    </td>
                    <td className="is-center is-strong">
                      {show.show_scored && show.highScore != null ?
                        show.highScore
                      : ""}
                    </td>
                    <td className="is-center is-muted">
                      {show.show_scored && show.averageScore != null ?
                        show.averageScore.toFixed(2)
                      : ""}
                    </td>
                    <td
                      className={cn(
                        "is-center echo-tour-show-stats-over-under",
                        overUnderClass(
                          show.averageOverUnder,
                          show.show_scored ?? false,
                        ),
                      )}
                    >
                      {formatOverUnderValue(
                        show.averageOverUnder,
                        show.show_scored ?? false,
                      )}
                    </td>
                    <td className="is-center is-muted">
                      {show.show_scored && show.totalCorrectSongs != null ?
                        show.totalCorrectSongs
                      : ""}
                    </td>
                    <td className="is-center is-muted">
                      {show.show_scored && show.averageCorrectSongs != null ?
                        show.averageCorrectSongs.toFixed(2)
                      : ""}
                    </td>
                    <td className="is-center is-muted">
                      {show.show_scored && show.totalCorrectSets != null ?
                        show.totalCorrectSets
                      : ""}
                    </td>
                    <td className="is-center is-muted">
                      {show.show_scored && show.averageCorrectSets != null ?
                        show.averageCorrectSets.toFixed(2)
                      : ""}
                    </td>
                    <td className="is-center is-muted">
                      {show.show_scored && show.usersPickedOpener != null ?
                        show.usersPickedOpener
                      : ""}
                    </td>
                    <td className="is-center is-muted">
                      {show.show_scored && show.usersPickedCloser != null ?
                        show.usersPickedCloser
                      : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
      </div>
    </section>
  )
}
