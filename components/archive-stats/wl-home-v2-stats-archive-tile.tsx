"use client"

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function WlHomeV2StatsArchiveTile({
  panelTitle,
  panelHeadRight,
  headerAccentClass,
  bgIndex,
  children,
  embed = "standard",
}: {
  panelTitle?: string
  panelHeadRight?: ReactNode
  headerAccentClass?: string
  bgIndex: number
  children: ReactNode
  /** Match tour stats: `side-card` + `.sc-label` + setlist row chrome (not `widget-panel`). */
  embed?: "standard" | "tour-song-spread"
}) {
  const showHeadRight = panelHeadRight != null || headerAccentClass != null
  const tileBgIndex = bgIndex % 4

  if (embed === "tour-song-spread") {
    return (
      <section
        className="tile tile-stats tile-stats--tour-song-spread"
        data-wl-stats-tile-bg={String(tileBgIndex)}
      >
        <div className="tile-stats-inner">
          <div className="wl-home-v2-setlist flex min-h-0 min-w-0 flex-1 flex-col">
            <div
              className="side-card wl-home-v2-setlist-song-spread-side-card wl-home-v2-tour-stats-song-spread flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-[rgb(44,46,45)]"
            >
              <div className="sc-label">Song Spread</div>
              {children}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      className="tile tile-stats"
      data-wl-stats-tile-bg={String(tileBgIndex)}
    >
      <div className="tile-stats-inner">
        <div className="widget-panel wl-home-v2-stats-archive-widget-panel">
          <div className="wp-head wl-home-v2-years-shows-wp-head">
            <span className="min-w-0 truncate">{panelTitle}</span>
            {showHeadRight ?
              <div className="wp-head-right">
                {panelHeadRight}
                {headerAccentClass ?
                  <span
                    className={cn(
                      "wl-home-v2-top-slots-swatch",
                      headerAccentClass,
                    )}
                    aria-hidden
                  />
                : null}
              </div>
            : null}
          </div>
          <div className="wl-home-v2-stats-archive-widget-panel__body">
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}
