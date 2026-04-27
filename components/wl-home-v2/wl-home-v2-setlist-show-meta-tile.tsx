"use client"

import Link from "next/link"
import type { CSSProperties } from "react"

import {
  CategoryCompleteBadge,
  DripfieldCompleteBadge,
  JiveCompleteBadge,
} from "@/components/dpro/setlist/setlist-badges-card"
import { SETLIST_SHOW_LENGTH_RANK_LIST_ID } from "@/components/dpro/setlist/setlist-show-stats-card"
import { useIsDesktopContentLayout } from "@/hooks/use-mobile"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getListArchiveUrl } from "@/lib/list-archive-url"
import {
  formatLengthAsHmmss,
  getGapColor,
  getGapPillBackground,
  getLengthRankTooltipText,
  getRarityColor,
  getRarityPillBackground,
  getSetlistSegmentLengths,
  totalSetlistLength,
} from "@/lib/setlist-utils"
import type { SetlistEntry, Show } from "@/types/setlist"

function formatShowLength(value: string | null | undefined): string {
  if (!value) return ""
  if (typeof value !== "string") return ""
  if (value.includes(":") || /^\d+$/.test(value)) return formatLengthAsHmmss(value)
  return value
}

export function isWlHomeV2SetlistShowStatsTileVisible(
  show: Show,
  setlist: SetlistEntry[],
): boolean {
  const totalLengthFromSetlist = totalSetlistLength(setlist) || null
  const displayLength =
    formatShowLength(show.show_length) ||
    (totalLengthFromSetlist ? formatLengthAsHmmss(totalLengthFromSetlist) : "") ||
    "—"
  const showLengthStat =
    displayLength &&
    displayLength !== "—" &&
    displayLength !== "0" &&
    displayLength !== "0:00:00"

  const hasRarity = show.show_rarity != null
  const hasGap = show.show_gap != null
  return !!(showLengthStat || hasRarity || hasGap)
}

export function isWlHomeV2SetlistShowBadgesTileVisible(show: Show): boolean {
  const hasCategory = !!show.show_listcategorycomplete
  const hasJive = show.show_jivecomplete === true
  const hasDripfield = show.show_dripfieldcomplete === true
  return hasCategory || hasJive || hasDripfield
}

/** True when either stats or badges aside tiles render. */
export function isWlHomeV2SetlistShowMetaTileVisible(
  show: Show,
  setlist: SetlistEntry[],
): boolean {
  return (
    isWlHomeV2SetlistShowStatsTileVisible(show, setlist) ||
    isWlHomeV2SetlistShowBadgesTileVisible(show)
  )
}

export function WlHomeV2SetlistShowStatsTile({
  show,
  setlist,
  showLengthRank,
}: {
  show: Show
  setlist: SetlistEntry[]
  showLengthRank: number | null
}) {
  const isDesktop = useIsDesktopContentLayout()
  if (!isWlHomeV2SetlistShowStatsTileVisible(show, setlist)) return null

  const totalLengthFromSetlist = totalSetlistLength(setlist) || null
  const displayLength =
    formatShowLength(show.show_length) ||
    (totalLengthFromSetlist ? formatLengthAsHmmss(totalLengthFromSetlist) : "") ||
    "—"
  const showLengthStat =
    displayLength &&
    displayLength !== "—" &&
    displayLength !== "0" &&
    displayLength !== "0:00:00"

  const rankInPillRange =
    showLengthRank != null &&
    showLengthRank >= 1 &&
    showLengthRank <= 25

  const rarityPctStr =
    show.show_rarity != null ?
      `${Number(show.show_rarity).toFixed(2)}%`
    : null

  const setLengthSegments =
    show.show_canonid != null ? getSetlistSegmentLengths(setlist) : []
  const showSetLengthSegments =
    show.show_canonid != null && setLengthSegments.length > 1

  return (
    <section
      className="wl-home-v2-years-tile"
      style={
        {
          "--tile-bg": "url('/newbg2.jpeg')",
        } as CSSProperties
      }
    >
      <div className="wl-home-v2-years-tile-inner flex flex-col gap-3">
        <div className="side-card wl-home-v2-setlist-show-stats">
          <div className="sc-label">Show Stats</div>
            {showLengthStat ?
              <div
                className={
                  showSetLengthSegments ?
                    "wl-home-v2-setlist-show-stat-row wl-home-v2-setlist-show-stat-row--segmented"
                  : "wl-home-v2-setlist-show-stat-row"
                }
              >
                <span className="wl-home-v2-setlist-show-stat-label">
                  <span className="wl-home-v2-setlist-show-stat-label-title">
                    Show Length
                  </span>
                  {showSetLengthSegments ?
                    <span className="wl-home-v2-setlist-show-stat-sublist">
                      {setLengthSegments.map((seg) => (
                        <span
                          key={seg.setKey}
                          className="wl-home-v2-setlist-show-stat-subrow-label"
                        >
                          {seg.label}
                        </span>
                      ))}
                    </span>
                  : null}
                </span>
                <span
                  className={
                    showSetLengthSegments ?
                      "wl-home-v2-setlist-show-stat-values wl-home-v2-setlist-show-stat-values--segmented"
                    : "wl-home-v2-setlist-show-stat-values"
                  }
                >
                  <span className="wl-home-v2-setlist-show-stat-values-pill-row">
                  {rankInPillRange ?
                    isDesktop ?
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={getListArchiveUrl(
                              SETLIST_SHOW_LENGTH_RANK_LIST_ID,
                            )}
                            className="wl-home-v2-setlist-show-stat-pill wl-home-v2-setlist-show-stat-pill--rank"
                          >
                            #{showLengthRank}
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent
                          className="setlist-header-tooltip"
                          side="top"
                          sideOffset={6}
                        >
                          {getLengthRankTooltipText(showLengthRank)}
                        </TooltipContent>
                      </Tooltip>
                    : <Link
                        href={getListArchiveUrl(
                          SETLIST_SHOW_LENGTH_RANK_LIST_ID,
                        )}
                        className="wl-home-v2-setlist-show-stat-pill wl-home-v2-setlist-show-stat-pill--rank"
                      >
                        #{showLengthRank}
                      </Link>
                  : null}
                  <span className="wl-home-v2-setlist-show-stat-pill wl-home-v2-setlist-show-stat-pill--length">
                    {displayLength}
                  </span>
                  </span>
                  {showSetLengthSegments ?
                    <span className="wl-home-v2-setlist-show-stat-segment-times">
                      {setLengthSegments.map((seg) => (
                        <span
                          key={seg.setKey}
                          className="wl-home-v2-setlist-show-stat-segment-time"
                        >
                          {seg.lengthHmmss || "—"}
                        </span>
                      ))}
                    </span>
                  : null}
                </span>
              </div>
            : null}
            {rarityPctStr != null ?
              <div className="wl-home-v2-setlist-show-stat-row">
                <span className="wl-home-v2-setlist-show-stat-label">
                  Show Rarity
                </span>
                <span
                  className="wl-home-v2-setlist-show-stat-pill"
                  style={{
                    background: getRarityPillBackground(rarityPctStr),
                    border: `1px solid ${getRarityColor(rarityPctStr)}`,
                  }}
                >
                  {Number(show.show_rarity).toFixed(2)}%
                </span>
              </div>
            : null}
            {show.show_gap != null ?
              <div className="wl-home-v2-setlist-show-stat-row">
                <span className="wl-home-v2-setlist-show-stat-label">
                  Average Show Gap
                </span>
                <span
                  className="wl-home-v2-setlist-show-stat-pill"
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
      </div>
    </section>
  )
}

export function WlHomeV2SetlistShowBadgesTile({ show }: { show: Show }) {
  if (!isWlHomeV2SetlistShowBadgesTileVisible(show)) return null

  const hasCategory = !!show.show_listcategorycomplete
  const hasJive = show.show_jivecomplete === true
  const hasDripfield = show.show_dripfieldcomplete === true

  return (
    <section
      className="wl-home-v2-years-tile"
      style={
        {
          "--tile-bg": "url('/newbg2.jpeg')",
        } as CSSProperties
      }
    >
      <div className="wl-home-v2-years-tile-inner flex flex-col gap-3">
        <div className="side-card">
          <div className="sc-label">Show Badges</div>
          <div className="wl-home-v2-setlist-badge-stack">
            {hasCategory ?
              <CategoryCompleteBadge
                categoryName={show.show_listcategorycomplete ?? null}
                linkClassName="wl-home-v2-setlist-badge-link"
              />
            : null}
            {hasJive ?
              <JiveCompleteBadge
                showJiveComplete
                linkClassName="wl-home-v2-setlist-badge-link"
              />
            : null}
            {hasDripfield ?
              <DripfieldCompleteBadge
                showDripfieldComplete
                linkClassName="wl-home-v2-setlist-badge-link"
              />
            : null}
          </div>
        </div>
      </div>
    </section>
  )
}
