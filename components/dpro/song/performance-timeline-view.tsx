"use client"


import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PERFORMANCE_YEARS, PLACEMENT_COLORS } from "@/lib/song-performance-utils"
import { PerformanceTooltipContent } from "./performance-tooltip"
import type { SongPerformance } from "@/types/song"

interface TimelinePerf {
  formattedDate: string
  show_id: string
  entry_placement: string
  fullData: SongPerformance
}

interface PerformanceTimelineViewProps {
  performancesByYear: Record<number, TimelinePerf[]>
  selectedGroup: string | null
}

export function PerformanceTimelineView({
  performancesByYear,
  selectedGroup,
}: PerformanceTimelineViewProps) {
  const shouldHighlight = (perf: SongPerformance) => {
    if (!selectedGroup) return false
    return perf.show_group === selectedGroup
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
                  .sort((a, b) => {
                    const dateComparison = a.formattedDate.localeCompare(
                      b.formattedDate,
                    )
                    if (dateComparison !== 0) return dateComparison
                    const setA = a.fullData.entry_set || ""
                    const setB = b.fullData.entry_set || ""
                    if (setA !== setB) return setA.localeCompare(setB)
                    return (
                      (parseInt(String(a.fullData.entry_setnum), 10) || 0) -
                      (parseInt(String(b.fullData.entry_setnum), 10) || 0)
                    )
                  })
                  .map((perf, idx) => {
                    const isHighlighted = shouldHighlight(perf.fullData)
                    const isMainSet = perf.entry_placement?.startsWith("Main Set ")
                    const bgColor =
                      isMainSet
                        ? "transparent"
                        : PLACEMENT_COLORS[perf.entry_placement] || "transparent"
                    return (
                      <Tooltip key={`${year}-${perf.formattedDate}-${idx}`}>
                        <TooltipTrigger asChild>
                          <Link
                            href={getSetlistArchiveUrl(perf.show_id)}
                            style={{
                              backgroundColor: bgColor,
                            }}
                            className={`block w-full text-[0.625rem] text-center px-0.5 font-medium rounded transition-colors hover:underline ${
                              bgColor !== "transparent" ? "text-white" : "text-foreground"
                            } ${
                              selectedGroup && !isHighlighted
                                ? "opacity-30"
                                : "opacity-100"
                            }`}
                          >
                            {perf.formattedDate}
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="hidden md:block">
                          <PerformanceTooltipContent fullData={perf.fullData} />
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
