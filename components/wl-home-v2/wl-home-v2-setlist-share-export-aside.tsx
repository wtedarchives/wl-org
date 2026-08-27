"use client"

import type { ShareExportDetailPill } from "@/components/wl-home-v2/wl-home-v2-setlist-share-export-card.lib"
import {
  getGapColor,
  getGapPillBackground,
  getRarityColor,
  getRarityPillBackground,
} from "@/lib/setlist-utils"
import { cn } from "@/lib/utils"
import type { Show } from "@/types/setlist"

export function WlHomeV2SetlistShareExportAside({
  detailPills,
  show,
  posterSrc,
  showShareExportStats,
  rarityPctStr,
}: {
  detailPills: ShareExportDetailPill[]
  show: Show
  /** Show poster, displayed under the stats. */
  posterSrc?: string | null
  showShareExportStats: boolean
  rarityPctStr: string | null
}) {
  return (
    <aside
      className="wl-home-v2-share-export__top-split-aside"
      aria-label="Show details"
    >
      <div className="wl-home-v2-share-export__pills wl-home-v2-share-export__pills--stack">
        {detailPills.map((pill) => (
          <div
            key={pill.key}
            className={cn(
              "wl-home-v2-share-export__pill",
              pill.key === "group-date" &&
                "wl-home-v2-share-export__pill--group-date",
            )}
          >
            {pill.lines.map((line, i) => (
              <span
                key={`${pill.key}-${i}`}
                className={cn(
                  "wl-home-v2-share-export__pill-line",
                  line.muted && "wl-home-v2-share-export__pill-line--muted",
                )}
              >
                {line.text}
              </span>
            ))}
          </div>
        ))}
      </div>
      {showShareExportStats ?
        <div
          className="wl-home-v2-share-export__show-stats"
          aria-label="Show rarity and average gap"
        >
          {rarityPctStr != null ?
            <div className="wl-home-v2-share-export__show-stats-row">
              <span className="wl-home-v2-share-export__show-stats-label">
                Show Rarity
              </span>
              <span
                className="wl-home-v2-share-export__show-stats-pill"
                style={{
                  background: getRarityPillBackground(rarityPctStr),
                  border: `1px solid ${getRarityColor(rarityPctStr)}`,
                }}
              >
                {rarityPctStr}
              </span>
            </div>
          : null}
          {show.show_gap != null ?
            <div className="wl-home-v2-share-export__show-stats-row">
              <span className="wl-home-v2-share-export__show-stats-label">
                Average Show Gap
              </span>
              <span
                className="wl-home-v2-share-export__show-stats-pill"
                style={{
                  background: getGapPillBackground(show.show_gap),
                  border: `1px solid ${getGapColor(show.show_gap)}`,
                }}
              >
                {Number(show.show_gap).toFixed(2)}
              </span>
            </div>
          : null}
        </div>
      : null}
      {posterSrc ?
        <div className="wl-home-v2-share-export__poster">
          {/* eslint-disable-next-line @next/next/no-img-element -- PNG capture path */}
          <img
            src={posterSrc}
            alt=""
            crossOrigin="anonymous"
            className="wl-home-v2-share-export__poster-img"
            draggable={false}
          />
        </div>
      : null}
    </aside>
  )
}
