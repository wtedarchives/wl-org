"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { useIsDesktopContentLayout } from "@/hooks/use-mobile"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Show } from "@/types/setlist"
import {
  formatLengthAsHmmss,
  getRarityColor,
  getGapColor,
  getLengthRankTooltipText,
} from "@/lib/setlist-utils"

const LENGTH_RANK_LIST_ID = "45a4b90e-adbe-4af5-9051-2f4d212069fc"

interface SetlistShowStatsCardProps {
  show: Show
  totalLengthFromSetlist: string | null
  showLengthRank: number | null
}

function formatShowLength(value: string | null | undefined): string {
  if (!value) return ""
  if (typeof value !== "string") return ""
  if (value.includes(":") || /^\d+$/.test(value)) return formatLengthAsHmmss(value)
  return value
}

export function SetlistShowStatsCard({
  show,
  totalLengthFromSetlist,
  showLengthRank,
}: SetlistShowStatsCardProps) {
  const isDesktop = useIsDesktopContentLayout()
  const displayLength =
    formatShowLength(show.show_length) || (totalLengthFromSetlist ? formatLengthAsHmmss(totalLengthFromSetlist) : "") || "—"
  const showLengthStat =
    displayLength &&
    displayLength !== "—" &&
    displayLength !== "0" &&
    displayLength !== "0:00:00"

  const hasRarity = show.show_rarity != null
  const hasGap = show.show_gap != null
  const hasAnyStats = showLengthStat || hasRarity || hasGap

  if (!hasAnyStats) return null

  return (
    <Card className="border-border/60 bg-card/80 py-0">
      <CardContent className="p-3">
        <p className="text-xs font-medium text-foreground mb-2">Show Stats</p>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          {showLengthStat && (
            <li className="flex items-center justify-between gap-2">
              <span>Show Length</span>
              <div className="flex items-center gap-1.5">
                {showLengthRank != null &&
                  showLengthRank >= 1 &&
                  showLengthRank <= 25 &&
                  (isDesktop ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={`/dpro/lists/${LENGTH_RANK_LIST_ID}`}
                          className="inline-block rounded px-1 py-[1px] text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-600/80 transition-colors"
                        >
                          #{showLengthRank}
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {getLengthRankTooltipText(showLengthRank)}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Link
                      href={`/dpro/lists/${LENGTH_RANK_LIST_ID}`}
                      className="inline-block rounded px-1 py-[1px] text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-600/80 transition-colors"
                    >
                      #{showLengthRank}
                    </Link>
                  ))}
                <span className="inline-block rounded px-1.5 py-[1px] tabular-nums text-xs font-medium text-white bg-wl-dark-green">
                  {displayLength}
                </span>
              </div>
            </li>
          )}
          {show.show_rarity != null && (
            <li className="flex justify-between gap-2">
              <span>Show Rarity</span>
              <span
                className="inline-block rounded px-1.5 py-[1px] tabular-nums text-xs font-medium text-white"
                style={{
                  backgroundColor: getRarityColor(
                    Number(show.show_rarity).toFixed(2) + "%",
                  ),
                }}
              >
                {Number(show.show_rarity).toFixed(2)}%
              </span>
            </li>
          )}
          {show.show_gap != null && (
            <li className="flex justify-between gap-2">
              <span>Average Show Gap</span>
              <span
                className="inline-block rounded px-1.5 py-[1px] tabular-nums text-xs font-medium text-white"
                style={{
                  backgroundColor: getGapColor(show.show_gap),
                }}
              >
                {Number(show.show_gap).toFixed(2)}
              </span>
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  )
}
