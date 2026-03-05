"use client"

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
import { getRankingText } from "@/lib/stats/stats-formatting"
import { getRarityColor, getGapColor } from "@/lib/stats/tour-utils"

const LONGEST_SHOWS_LIST_ID = "45a4b90e-adbe-4af5-9051-2f4d212069fc"

interface ShowStatCardProps {
  title: string
  headerClassName?: string
  items: ShowStat[]
  valueFormatter?: (value: string | number) => React.ReactNode
  showLengthRank?: boolean
  showEmptyState?: boolean
  subtitle?: string
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
}: ShowStatCardProps) {
  const icon = getTitleIcon(title)

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
          <div className="px-3 py-4 text-center text-xs text-muted-foreground">
            No data to display for this year.
          </div>
        ) : (
          <Table>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.show_id}>
                  <TableCell className="py-[6.665px] pl-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dpro/setlist/${item.show_id}`}
                        className="text-xs font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        {item.show_date}
                      </Link>
                      {showLengthRank && item.show_length_rank != null && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href={`/dpro/lists/${LONGEST_SHOWS_LIST_ID}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block rounded bg-yellow-500 px-1 py-0.5 text-[10px] font-medium text-black"
                              >
                                #{item.show_length_rank}
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="text-xs">
                              {getRankingText(item.show_length_rank)}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-[7.33px] pl-2 text-xs text-muted-foreground">
                    {item.show_venue_location ? (
                      item.venue_id ? (
                        <Link
                          href={`/dpro/venue/${item.venue_id}`}
                          className="text-foreground underline-offset-4 hover:underline"
                        >
                          {item.show_venue_location.replace(/[\[\]]/g, "")}
                        </Link>
                      ) : (
                        item.show_venue_location.replace(/[\[\]]/g, "")
                      )
                    ) : (
                      ""
                    )}
                  </TableCell>
                  <TableCell className="py-[7.33px] pl-2 text-xs text-muted-foreground">
                    {item.show_tour ? (
                      item.tour_id ? (
                        <Link
                          href={`/dpro/tours/${item.tour_id}`}
                          className="text-foreground underline-offset-4 hover:underline"
                        >
                          {item.show_tour}
                        </Link>
                      ) : (
                        item.show_tour
                      )
                    ) : (
                      ""
                    )}
                  </TableCell>
                  <TableCell
                    className={`w-[60px] ${
                      title === "Shows with Rarest Setlist" ||
                      title === "Shows with Longest Average Show Gap"
                        ? "py-[5.33px]"
                        : "py-[7.33px]"
                    } text-center text-xs font-medium`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {valueFormatter ? (
                        valueFormatter(item.value)
                      ) : (
                        item.value
                      )}
                      {title === "Highest Rated Shows" && (
                        <Star className="size-2.5 text-muted-foreground fill-current" />
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

export function RarityValue({ value }: { value: string | number }) {
  const bg = getRarityColor(String(value))
  return (
    <span
      className="inline-block rounded px-1.5 py-0.5 text-white"
      style={{ backgroundColor: bg }}
    >
      {value}
    </span>
  )
}

export function GapValue({ value }: { value: string | number }) {
  const bg = getGapColor(String(value))
  return (
    <span
      className="inline-block rounded px-1.5 py-0.5 text-white"
      style={{ backgroundColor: bg }}
    >
      {value}
    </span>
  )
}
