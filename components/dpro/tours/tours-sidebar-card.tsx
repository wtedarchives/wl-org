"use client"

import Link from "next/link"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Tour } from "@/types/tour"

const TOUR_COLORS = [
  "#0bacc9",
  "#e4482f",
  "#fcb924",
  "#67a343",
  "#9e598f",
  "#be823a",
  "#f58ba2",
  "#7b6e66",
  "#ec7523",
  "#050608",
  "#fee4d3",
  "#5a2c08",
  "#8ecfbb",
]

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
}

export function ToursSidebarCard({
  tours,
  currentTourId,
  expandedYear,
  onToggleYear,
  onTourSelect,
  loading,
  className,
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
                    {isExpanded ? (
                      <ChevronDown className="size-3 shrink-0" />
                    ) : (
                      <ChevronRight className="size-3 shrink-0" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="pb-1">
                      {yearTours.map((tour) => {
                        const isCurrent = currentTourId === tour.tour_id
                        const color =
                          TOUR_COLORS[
                            tours.indexOf(tour) % TOUR_COLORS.length
                          ]
                        return (
                          <div
                            key={tour.tour_id}
                            className="flex items-stretch"
                          >
                            <div
                              className="w-1 shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            <div className="flex-1 px-2 py-1 leading-tight">
                              <Link
                                href={`/dpro/tours/${tour.tour_id}`}
                                onClick={() => onTourSelect?.(tour.tour_id)}
                                className={cn(
                                  "text-[11px] font-medium hover:underline block",
                                  isCurrent && "bg-muted/80 rounded px-1 -mx-1"
                                )}
                              >
                                {tour.tour}
                              </Link>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
