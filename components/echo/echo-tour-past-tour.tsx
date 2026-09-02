"use client"

import Link from "next/link"

import { useEchoTourInfo } from "@/hooks/use-echo-tour-info"
import { getEchoHistoryUrl } from "@/lib/echo-archive-url"
import { echoTourSurfaceBgStyle } from "@/lib/echo-tour-surface-bg"

import { EchoTourHero } from "./echo-tour-hero"
import { EchoTourShowStatistics } from "./echo-tour-show-statistics"
import { EchoTourShows } from "./echo-tour-shows"
import { EchoTourStandingsCard } from "./echo-tour-standings"

export function EchoTourPastTour({ tourId }: { tourId: string }) {
  const { loading, tour } = useEchoTourInfo(tourId)

  if (loading) {
    return (
      <div
        className="echo-tour-placeholder"
        style={echoTourSurfaceBgStyle("past-tour-loading")}
      >
        <p className="echo-tour-placeholder-copy">Loading tour…</p>
      </div>
    )
  }

  if (!tour) {
    return (
      <div
        className="echo-tour-placeholder"
        style={echoTourSurfaceBgStyle("past-tour-missing")}
      >
        <Link href={getEchoHistoryUrl()} className="echo-tour-back-link">
          ← History
        </Link>
        <h1 className="echo-live-title">Tour not found</h1>
        <p className="echo-tour-placeholder-copy">
          That tour may have been removed or the link is invalid.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="echo-tour-past-tour-nav">
        <Link href={getEchoHistoryUrl()} className="echo-tour-back-link">
          ← History
        </Link>
      </div>
      <EchoTourHero league={tour.tour} title={tour.tour} />
      <div className="echo-tour-countdown echo-tour-countdown--standings-only">
        <div className="echo-tour-side">
          <EchoTourStandingsCard league={tour.tour} />
        </div>
      </div>
      <EchoTourShows league={tour.tour} allowAdmin={false} />
      <EchoTourShowStatistics league={tour.tour} />
    </>
  )
}
