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
                                href={`/dpro/tours/${tour.tour_id}`}
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
