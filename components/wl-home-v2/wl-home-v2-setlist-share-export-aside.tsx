"use client"

import type { ShareExportDetailPill } from "@/components/wl-home-v2/wl-home-v2-setlist-share-export-card.lib"
import { prepareWlHomeV2ShareExportRichHtml } from "@/lib/wl-home-v2-share-export-rich-html"
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
  coachNotes,
  showShareExportStats,
  rarityPctStr,
}: {
  detailPills: ShareExportDetailPill[]
  show: Show
  coachNotes: string
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
      {coachNotes ?
        <div className="wl-home-v2-share-export__block">
          <div
            className="wl-home-v2-share-export__rich"
            dangerouslySetInnerHTML={{
              __html: prepareWlHomeV2ShareExportRichHtml(coachNotes),
            }}
          />
        </div>
      : null}
    </aside>
  )
}
