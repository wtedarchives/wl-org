"use client"

import { useId } from "react"
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
  /** Hide panel title when wrapped in {@link WlHomeV2YearsToolModal}. */
  embedInModal?: boolean
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
  embedInModal = false,
}: ToursSidebarCardProps) {
  const toursSidebarIdPrefix = useId()
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
      <section
        className={cn(
          "widget-panel",
          embedInModal && "wl-home-v2-years-tool-popup-panel--tours",
          className,
        )}
        aria-label={embedInModal ? "Browse tours by year" : undefined}
        aria-labelledby={embedInModal ? undefined : `${toursSidebarIdPrefix}-heading`}
        data-wl-v2-tours-sidebar=""
      >
        {embedInModal ? null : (
          <h2 className="wp-head" id={`${toursSidebarIdPrefix}-heading`}>
            <span>Tours</span>
          </h2>
        )}
        {loading ?
          <p className="py-3 text-center text-xs text-white/55">Loading tours…</p>
        : sortedYears.length === 0 ?
          <p className="py-3 text-center text-xs text-white/55">No tours found.</p>
        : (
          <nav aria-label="Browse tours by year">
            <div className="wl-home-v2-tours-sidebar-year-list">
              {sortedYears.map((year) => {
                const isExpanded = expandedYear === year
                const yearTours = toursByYear[year]
                const yearSlug = year.replace(/[^a-zA-Z0-9_-]/g, "-")
                const regionId = `${toursSidebarIdPrefix}-year-${yearSlug}`
                const triggerId = `${toursSidebarIdPrefix}-toggle-${yearSlug}`
                return (
                  <div
                    key={year}
                    className="wl-home-v2-tours-sidebar-year-group"
                  >
                    <button
                      type="button"
                      id={triggerId}
                      aria-expanded={isExpanded}
                      aria-controls={regionId}
                      onClick={() => onToggleYear(year)}
                      className="wl-home-v2-tours-sidebar-year-btn"
                    >
                      <span className="min-w-0 font-medium">{year}</span>
                      <span aria-hidden className="shrink-0 opacity-90">
                        {isExpanded ?
                          <CaretDown className="size-3" />
                        : <CaretRight className="size-3" />}
                      </span>
                    </button>
                    <div
                      className="transition-[grid-template-rows] duration-200 ease-out"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1fr)",
                        gridTemplateRows: isExpanded ? "1fr" : "0fr",
                      }}
                    >
                      <div className="wl-home-v2-tours-sidebar-expand-clip overflow-hidden">
                        <div
                          role="region"
                          id={regionId}
                          aria-labelledby={triggerId}
                          hidden={!isExpanded}
                        >
                          <div className="wl-home-v2-tours-sidebar-tour-stack">
                            {yearTours.map((tour) => {
                              const isCurrent = currentTourId === tour.tour_id
                              return (
                                <Link
                                  key={tour.tour_id}
                                  href={getTourArchiveUrl(tour.tour_id)}
                                  onClick={() => onTourSelect?.(tour.tour_id)}
                                  aria-current={isCurrent ? "page" : undefined}
                                  className="topic-row !items-center gap-2"
                                >
                                  <span className="min-w-0 flex-1 text-[12px] font-medium leading-3">
                                    {tour.tour}
                                  </span>
                                </Link>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </nav>
        )}
      </section>
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
