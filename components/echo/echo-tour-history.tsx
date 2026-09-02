"use client"

import Link from "next/link"

import { usePastTours } from "@/hooks/use-past-tours"
import { getEchoPastTourUrl } from "@/lib/echo-archive-url"
import { echoTourSurfaceBgStyle } from "@/lib/echo-tour-surface-bg"

import { ECHO_ACTIVE_LEAGUE } from "./echo-tour-data"

export function EchoTourHistory() {
  const { loading, pastTours } = usePastTours(ECHO_ACTIVE_LEAGUE)

  return (
    <div
      className="echo-tour-history"
      style={echoTourSurfaceBgStyle("history")}
    >
      <h1 className="echo-live-title echo-tour-history-title">History</h1>

      {loading ?
        <p className="echo-tour-history-empty">Loading past tours…</p>
      : pastTours.length === 0 ?
        <p className="echo-tour-history-empty">No past tours found.</p>
      : <div
          className="echo-tour-history-scroll"
          role="region"
          aria-label="Past tours"
        >
          <table className="echo-tour-history-table">
            <colgroup>
              <col />
              <col className="echo-tour-history-col-metric" />
              <col className="echo-tour-history-col-metric" />
              <col />
            </colgroup>
            <thead className="echo-tour-history-head-row">
              <tr>
                <th scope="col" className="is-left">
                  Tour
                </th>
                <th scope="col" className="is-center is-metric">
                  Players
                </th>
                <th scope="col" className="is-center is-metric">
                  Shows
                </th>
                <th scope="col" className="is-left">
                  Winner(s)
                </th>
              </tr>
            </thead>
            <tbody>
              {pastTours.map((tour) => (
                <tr key={tour.tour_id} className="echo-tour-history-row">
                  <td className="is-tour">
                    <Link
                      href={getEchoPastTourUrl(tour.tour_id)}
                      className="echo-tour-history-tour-link"
                      scroll={false}
                    >
                      {tour.tour}
                    </Link>
                  </td>
                  <td className="is-center is-muted">{tour.playerCount}</td>
                  <td className="is-center is-muted">{tour.showCount}</td>
                  <td className="is-winners">
                    {tour.winners.length > 0 ?
                      tour.winners.map((winner, index) => (
                        <span key={`${winner.username}-${index}`}>
                          {winner.username}{" "}
                          <span className="echo-tour-history-winner-score">
                            ({winner.score})
                          </span>
                          {index < tour.winners.length - 1 ? ", " : ""}
                        </span>
                      ))
                    : <span className="is-muted is-italic">No scores</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
    </div>
  )
}
