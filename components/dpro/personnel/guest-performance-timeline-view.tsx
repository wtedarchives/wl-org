"use client"

import Link from "next/link"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PERFORMANCE_YEARS } from "@/lib/song-performance-utils"
import { formatSetlistDate } from "@/lib/setlist-utils"
import type { GuestShow } from "@/hooks/use-guest-data"

interface GuestTimelinePerf {
  formattedDate: string
  show_id: string
  fullData: GuestShow
}

interface GuestPerformanceTimelineViewProps {
  performancesByYear: Record<number, GuestTimelinePerf[]>
  selectedGroup: string | null
}

export function GuestPerformanceTimelineView({
  performancesByYear,
  selectedGroup,
}: GuestPerformanceTimelineViewProps) {
  const shouldHighlight = (perf: GuestShow) => {
    if (selectedGroup && perf.show_group !== selectedGroup) return false
    return true
  }

  return (
    <div className="p-2">
      <div className="overflow-x-auto flex justify-start">
        <div className="flex flex-row min-w-max">
          {PERFORMANCE_YEARS.map((year, index) => (
            <div
              key={year}
              className={`w-14 px-1 ${
                index !== PERFORMANCE_YEARS.length - 1
                  ? "border-r border-border"
                  : ""
              }`}
            >
              <div className="text-muted-foreground text-xs font-medium mb-1 text-center bg-muted/60 rounded py-0.5">
                {year}
              </div>
              <div className="space-y-px">
                {performancesByYear[year]
                  ?.slice()
                  .sort((a, b) => a.formattedDate.localeCompare(b.formattedDate))
                  .map((perf, idx) => {
                    const isHighlighted = shouldHighlight(perf.fullData)
                    return (
                      <Tooltip key={`${year}-${perf.show_id}-${idx}`}>
                        <TooltipTrigger asChild>
                          <Link
                            href={`/archive/setlist/${perf.show_id}`}
                            className={`block w-full text-[0.625rem] text-center px-0.5 font-medium rounded transition-colors hover:underline text-foreground ${
                              selectedGroup && !isHighlighted
                                ? "opacity-30"
                                : "opacity-100"
                            }`}
                          >
                            {perf.formattedDate}
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <div className="text-xs space-y-0.5">
                            <p className="font-medium">
                              {formatSetlistDate(perf.fullData.show_date)}
                            </p>
                            <p>{perf.fullData.show_group}</p>
                            <p className="text-muted-foreground">
                              {perf.fullData.show_venue_location}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
