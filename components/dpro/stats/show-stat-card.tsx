"use client"

import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import Link from "next/link"
import { Clock, Space, Flame, Users, Star } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"
import type { ShowStat } from "@/lib/types/stats"
import { SETLIST_SHOW_LENGTH_RANK_LIST_ID } from "@/components/dpro/setlist/setlist-show-stats-card"
import {
  getGapColor,
  getGapPillBackground,
  getRarityColor,
  getRarityPillBackground,
  getLengthRankTooltipText,
} from "@/lib/setlist-utils"
import { TourShowsStatPill } from "@/components/dpro/tours/tour-shows-stat-pill"
import { getListArchiveUrl } from "@/lib/list-archive-url"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"
import { useIsDesktopContentLayout } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface ShowStatCardProps {
  title: string
  headerClassName?: string
  items: ShowStat[]
  valueFormatter?: (value: string | number) => React.ReactNode
  showLengthRank?: boolean
  showEmptyState?: boolean
  subtitle?: string
  wlHomeV2?: boolean
  /** Stats archive Shows tiles: 21.34px table rows (compact). */
  wlHomeV2FixedShowStatRowHeight?: boolean
}

function getTitleIcon(title: string) {
  if (title === "Longest Shows") return <Clock className="size-3.5" />
  if (title === "Shows with Longest Average Show Gap") return <Space className="size-3.5" />
  if (title === "Shows with Rarest Setlist") return <Flame className="size-3.5" />
  if (title === "Most Attended Shows") return <Users className="size-3.5" />
  if (title === "Highest Rated Shows") return <Star className="size-3.5 fill-current" />
  return null
}

export function ShowStatCard({
  title,
  headerClassName,
  items,
  valueFormatter,
  showLengthRank = false,
  showEmptyState = false,
  subtitle,
  wlHomeV2 = false,
  wlHomeV2FixedShowStatRowHeight = false,
}: ShowStatCardProps) {
  const icon = getTitleIcon(title)
  const isDesktop = useIsDesktopContentLayout()

  return (
    <Card className="overflow-hidden py-0">
      <CardHeader
        className={headerClassName ?? "bg-muted/60 py-2"}
      >
        <div className="flex flex-wrap items-center justify-between gap-1">
          <div className="flex items-center gap-1">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {title === "Highest Rated Shows" && icon}
          </div>
          {subtitle ? (
            <span className="text-[10px] font-normal text-muted-foreground">
              {subtitle}
            </span>
          ) : (
            icon
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 && showEmptyState ? (
          <div
            className={cn(
              "px-3 py-4 text-center text-xs",
              wlHomeV2 ?
                "text-white/55"
              : "text-muted-foreground",
            )}
          >
            No data to display for this year.
          </div>
        ) : (
          <Table
            className={cn(
              "caption-bottom w-full",
              wlHomeV2 ?
                cn(
                  "min-w-max border-collapse text-[11px] leading-3 wl-home-v2-years-table wl-home-v2-top-slots-stats-table wl-home-v2-show-stats-table",
                  wlHomeV2FixedShowStatRowHeight &&
                    "wl-home-v2-show-stats-table--fixed-row-height",
                )
              : "text-xs",
            )}
          >
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item.show_id}
                  className={
                    wlHomeV2 ? "wl-home-v2-top-slots-stats-row" : undefined
                  }
                >
                  <TableCell
                    className={cn(
                      wlHomeV2 ?
                        "wl-home-v2-top-slots-stats-cell align-middle"
                      : "py-[6.665px] pl-3",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Link
                        href={getSetlistArchiveUrl(item.show_id)}
                        className={cn(
                          "font-medium hover:underline",
                          wlHomeV2 ?
                            "text-white/88"
                          : "text-xs text-foreground",
                        )}
                      >
                        {item.show_date}
                      </Link>
                      {showLengthRank &&
                        item.show_length_rank != null &&
                        item.show_length_rank >= 1 &&
                        item.show_length_rank <= 25 &&
                        (wlHomeV2 ?
                          isDesktop ?
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link
                                    href={getListArchiveUrl(
                                      SETLIST_SHOW_LENGTH_RANK_LIST_ID,
                                    )}
                                    className="wl-home-v2-setlist-show-stat-pill wl-home-v2-setlist-show-stat-pill--rank"
                                  >
                                    #{item.show_length_rank}
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent
                                  className="setlist-header-tooltip"
                                  side="top"
                                  sideOffset={6}
                                >
                                  {getLengthRankTooltipText(
                                    item.show_length_rank,
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          : <Link
                              href={getListArchiveUrl(
                                SETLIST_SHOW_LENGTH_RANK_LIST_ID,
                              )}
                              className="wl-home-v2-setlist-show-stat-pill wl-home-v2-setlist-show-stat-pill--rank"
                            >
                              #{item.show_length_rank}
                            </Link>
                        : isDesktop ?
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link
                                  href={getListArchiveUrl(
                                    SETLIST_SHOW_LENGTH_RANK_LIST_ID,
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-block rounded px-1 py-[1px] text-[11px] font-semibold text-white bg-blue-600 transition-colors hover:bg-blue-600/80"
                                >
                                  #{item.show_length_rank}
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent
                                className="setlist-header-tooltip"
                                side="top"
                                sideOffset={6}
                              >
                                {getLengthRankTooltipText(
                                  item.show_length_rank,
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        : <Link
                            href={getListArchiveUrl(
                              SETLIST_SHOW_LENGTH_RANK_LIST_ID,
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block rounded px-1 py-[1px] text-[11px] font-semibold text-white bg-blue-600 transition-colors hover:bg-blue-600/80"
                          >
                            #{item.show_length_rank}
                          </Link>)}
                    </div>
                  </TableCell>
                  <TableCell
                    className={cn(
                      wlHomeV2 ?
                        "wl-home-v2-top-slots-stats-cell align-middle text-white/55"
                      : "py-[7.33px] pl-2 text-xs text-muted-foreground",
                    )}
                  >
                    {item.show_venue_location ? (
                      item.venue_id ? (
                        <Link
                          href={getVenueArchiveUrl(item.venue_id)}
                          className={cn(
                            "hover:underline",
                            wlHomeV2 ?
                              "text-white/88"
                            : "text-foreground",
                          )}
                        >
                          {item.show_venue_location}
                        </Link>
                      ) : (
                        <span
                          className={cn(wlHomeV2 && "text-white/88")}
                        >
                          {item.show_venue_location}
                        </span>
                      )
                    ) : (
                      ""
                    )}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "w-[60px] text-center font-medium tabular-nums",
                      wlHomeV2 ?
                        "wl-home-v2-top-slots-stats-cell align-middle text-white/88"
                      : cn(
                          "text-xs",
                          title === "Shows with Rarest Setlist" ||
                            title === "Shows with Longest Average Show Gap"
                            ? "py-[5.33px]"
                            : "py-[7.33px]",
                        ),
                    )}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {valueFormatter ? (
                        valueFormatter(item.value)
                      ) : (
                        item.value
                      )}
                      {title === "Highest Rated Shows" && (
                        <Star
                          className={cn(
                            "size-2.5 fill-current",
                            wlHomeV2 ?
                              "text-white/45"
                            : "text-muted-foreground",
                          )}
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function rarityValueToPctString(value: string | number): string {
  const s = String(value).trim()
  if (s.endsWith("%")) return s
  const n = Number.parseFloat(s.replace(/%/g, ""))
  if (!Number.isFinite(n)) return s
  return `${n.toFixed(2)}%`
}

export function RarityValue({ value }: { value: string | number }) {
  const pct = rarityValueToPctString(value)
  return (
    <TourShowsStatPill
      fill={getRarityPillBackground(pct)}
      border={getRarityColor(pct)}
    >
      {pct}
    </TourShowsStatPill>
  )
}

function gapValueToNumber(value: string | number): number | null {
  if (typeof value === "number")
    return Number.isFinite(value) ? value : null
  const n = Number.parseFloat(String(value).replace(/,/g, "").trim())
  return Number.isFinite(n) ? n : null
}

export function GapValue({ value }: { value: string | number }) {
  const n = gapValueToNumber(value)
  if (n == null) {
    return <span className="text-muted-foreground">—</span>
  }
  return (
    <TourShowsStatPill
      fill={getGapPillBackground(n)}
      border={getGapColor(n)}
    >
      {n.toFixed(2)}
    </TourShowsStatPill>
  )
}
