"use client"

import Link from "next/link"
import { CaretDown, CaretRight } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Tour } from "@/types/tour"
import { getTourArchiveUrl } from "@/lib/tour-archive-url"

function extractYear(tourName: string): string {
  const match = tourName.match(/^(\d{4})/)
  return match ? match[1] : "Unknown"
}

interface ToursSidebarCardProps {
  tours: Tour[]
  currentTourId: string | null
  expandedYear: string | null
  onToggleYear: (year: string) => void
  onTourSelect?: (tourId: string) => void
  loading: boolean
  className?: string
  wlHomeV2?: boolean
}

export function ToursSidebarCard({
  tours,
  currentTourId,
  expandedYear,
  onToggleYear,
  onTourSelect,
  loading,
  className,
  wlHomeV2 = false,
}: ToursSidebarCardProps) {
  const toursByYear = tours.reduce<Record<string, Tour[]>>((acc, tour) => {
    const year = extractYear(tour.tour)
    if (!acc[year]) acc[year] = []
    acc[year].push(tour)
    return acc
  }, {})

  const sortedYears = Object.keys(toursByYear).sort((a, b) => {
    if (a === "Unknown") return 1
    if (b === "Unknown") return -1
    return parseInt(b, 10) - parseInt(a, 10)
  })

  sortedYears.forEach((year) => {
    toursByYear[year].sort((a, b) => a.tour_canonid - b.tour_canonid)
  })

  if (wlHomeV2) {
    return (
      <div className={cn("widget-panel", className)}>
        <div className="wp-head">
          <span>Tours</span>
        </div>
        {loading ?
          <div className="py-3 text-center text-xs text-white/55">
            Loading tours…
          </div>
        : sortedYears.length === 0 ?
          <div className="py-3 text-center text-xs text-white/55">
            No tours found.
          </div>
        : (
          <div className="divide-y divide-white/10">
            {sortedYears.map((year) => {
              const isExpanded = expandedYear === year
              const yearTours = toursByYear[year]
              return (
                <div key={year}>
                  <button
                    type="button"
                    onClick={() => onToggleYear(year)}
                    className="flex w-full items-center justify-between px-2 py-1.5 text-left text-xs text-white/90 transition-colors hover:bg-white/5"
                  >
                    <span className="font-medium">{year}</span>
                    {isExpanded ?
                      <CaretDown className="size-3 shrink-0 opacity-80" aria-hidden />
                    : <CaretRight className="size-3 shrink-0 opacity-80" aria-hidden />}
                  </button>
                  <div
                    className="grid transition-[grid-template-rows] duration-200 ease-out"
                    style={{
                      gridTemplateRows: isExpanded ? "1fr" : "0fr",
                    }}
                  >
                    <div className="overflow-hidden">
                      <div className="pb-1">
                        {yearTours.map((tour) => {
                          const isCurrent = currentTourId === tour.tour_id
                          return (
                            <div key={tour.tour_id} className="pl-3">
                              <Link
                                href={getTourArchiveUrl(tour.tour_id)}
                                onClick={() => onTourSelect?.(tour.tour_id)}
                                className={cn(
                                  "topic-row !items-center !py-1.5 text-[12px] font-medium leading-tight",
                                  isCurrent &&
                                    "border-[rgba(88,200,174,0.45)] bg-[rgba(88,200,174,0.12)]",
                                )}
                              >
                                <span className="min-w-0 flex-1">{tour.tour}</span>
                              </Link>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card
      className={cn(
        "ring-0 border border-border/60 bg-card/80 py-0",
        className
      )}
    >
      <CardHeader className="border-b border-border/50 py-2">
        <CardTitle className="text-sm font-semibold">Tours</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center px-3 py-4 text-xs text-muted-foreground">
            Loading tours…
          </div>
        ) : sortedYears.length === 0 ? (
          <div className="px-3 py-3 text-center text-xs text-muted-foreground">
            No tours found.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {sortedYears.map((year) => {
              const isExpanded = expandedYear === year
              const yearTours = toursByYear[year]
              return (
                <div key={year}>
                  <button
                    type="button"
                    onClick={() => onToggleYear(year)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-medium">{year}</span>
                    {isExpanded ?
                      <CaretDown className="size-3 shrink-0" aria-hidden />
                    : <CaretRight className="size-3 shrink-0" aria-hidden />}
                  </button>
                  <div
                    className="grid transition-[grid-template-rows] duration-200 ease-out"
                    style={{
                      gridTemplateRows: isExpanded ? "1fr" : "0fr",
                    }}
                  >
                    <div className="overflow-hidden">
                      <div className="pb-1">
                        {yearTours.map((tour) => {
                          const isCurrent = currentTourId === tour.tour_id
                          return (
                            <div key={tour.tour_id} className="pl-4">
                              <Link
                                href={getTourArchiveUrl(tour.tour_id)}
                                onClick={() => onTourSelect?.(tour.tour_id)}
                                className={cn(
                                  "text-[11px] font-medium hover:underline block py-1 leading-tight",
                                  isCurrent && "bg-muted/80 rounded px-1 -mx-1"
                                )}
                              >
                                {tour.tour}
                              </Link>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
