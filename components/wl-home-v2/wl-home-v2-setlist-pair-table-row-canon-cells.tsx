"use client"

import { type CSSProperties } from "react"

import { getLastCountBadgeStyle } from "@/components/dpro/setlist/display-setlist-table.constants"
import { SetlistEntryLastCell } from "@/components/dpro/setlist/setlist-entry-last-cell"
import { SetlistEntryStatsTooltip } from "@/components/dpro/setlist/setlist-entry-stats-tooltip"
import { entriesHaveSongStatsLines } from "@/components/dpro/setlist/setlist-entry-stats-tooltip-content"
import { SetlistExpandButton } from "@/components/dpro/setlist/setlist-expand-button"
import { cn } from "@/lib/utils"

import { SETLIST_V2_ROW_TOOLTIP_CONTENT } from "@/components/wl-home-v2/wl-home-v2-setlist-table.constants"
import type { SetlistEntry } from "@/types/setlist"

export function WlHomeV2SetlistPairTableRowCanonCells({
  showCanonColumns,
  isDesktop,
  onDataCellPointerEnter,
  entries,
  primaryEntry,
  sharedLastCount,
  lastBadgeStyle,
  sharedTourCount,
  combinedRarity,
  rarityPillBackground,
  rarityPillBorderColor,
  onExpand,
}: {
  showCanonColumns: boolean
  isDesktop: boolean
  onDataCellPointerEnter: () => void
  entries: SetlistEntry[]
  primaryEntry: SetlistEntry
  sharedLastCount: string | null
  lastBadgeStyle: ReturnType<typeof getLastCountBadgeStyle>
  sharedTourCount: string | null
  combinedRarity: string
  rarityPillBackground: string
  rarityPillBorderColor: string
  onExpand: () => void
}) {
  if (!showCanonColumns) return null

  return (
    <>
      <td
        className="last-cell"
        onPointerEnter={isDesktop ? onDataCellPointerEnter : undefined}
      >
        <div className="setlist-cell-inner">
          {sharedLastCount ?
            <SetlistEntryLastCell
              entry={{ ...primaryEntry, last_count: sharedLastCount }}
              lastBadgeStyle={lastBadgeStyle}
              showTooltips={isDesktop}
              useWlHomeV2PillStyle
              tooltipContentClassName={SETLIST_V2_ROW_TOOLTIP_CONTENT.className}
            />
          : <SetlistExpandButton
              onClick={onExpand}
              ariaLabel="Show Last stats for individual songs"
            />
          }
        </div>
      </td>
      <td
        className="tour-cell"
        onPointerEnter={isDesktop ? onDataCellPointerEnter : undefined}
      >
        <div className="setlist-cell-inner">
          {sharedTourCount ?
            sharedTourCount
          : <SetlistExpandButton
              onClick={onExpand}
              ariaLabel="Show Tour stats for individual songs"
            />
          }
        </div>
      </td>
      <td
        className="rarity-cell"
        onPointerEnter={isDesktop ? onDataCellPointerEnter : undefined}
      >
        <div className="setlist-cell-inner">
          {combinedRarity ?
            isDesktop ?
              <SetlistEntryStatsTooltip entries={entries} wlV2Chrome>
                <span
                  className={cn(
                    "rare-pill",
                    entriesHaveSongStatsLines(entries) && "cursor-default",
                  )}
                  style={
                    {
                      "--setlist-rare-fill": rarityPillBackground,
                      "--setlist-rare-border": rarityPillBorderColor,
                    } as CSSProperties
                  }
                >
                  {combinedRarity}
                </span>
              </SetlistEntryStatsTooltip>
            : <span
                className="rare-pill"
                style={
                  {
                    "--setlist-rare-fill": rarityPillBackground,
                    "--setlist-rare-border": rarityPillBorderColor,
                  } as CSSProperties
                }
              >
                {combinedRarity}
              </span>
          : <SetlistExpandButton
              onClick={onExpand}
              ariaLabel="Show Rarity stats for individual songs"
            />
          }
        </div>
      </td>
    </>
  )
}
