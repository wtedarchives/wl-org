"use client"

import Link from "next/link"

import { ArchivePrefetchLink } from "@/components/archive/archive-prefetch-link"
import { cn } from "@/lib/utils"
import { getTourArchiveUrl } from "@/lib/tour-archive-url"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { TourCount } from "@/hooks/use-tours-data"

interface ToursCardProps {
  tours: TourCount[]
  currentYear: string
  loading: boolean
  className?: string
  wlHomeV2?: boolean
  /** Hide panel title when wrapped in a modal that already shows the title. */
  embedInModal?: boolean
}

export function ToursCard({
  tours,
  currentYear,
  loading,
  className,
  wlHomeV2 = false,
  embedInModal = false,
}: ToursCardProps) {
  const title =
    currentYear ? `${currentYear} Tours` : "Tours"

  if (wlHomeV2) {
    return (
      <div
        className={cn(
          "widget-panel",
          embedInModal && "wl-home-v2-years-tool-popup-panel--tours",
          className,
        )}
      >
        {embedInModal ? null : (
          <div className="wp-head">
            <span>{title}</span>
          </div>
        )}
        {loading ?
          <div className="py-3 text-center text-xs text-white/55">
            Loading tours…
          </div>
        : tours.length === 0 ?
          <div className="py-3 text-center text-xs text-white/55">
            No tours found.
          </div>
        : tours.map((tour) => {
            const [label, countPart] = tour.tour_count.split(" (")
            const countStr = countPart ? countPart.replace(")", "") : ""
            return (
              <ArchivePrefetchLink
                key={tour.tour_id || tour.tour_count}
                href={getTourArchiveUrl(tour.tour_id)}
                className="topic-row !items-center gap-2"
              >
                <span
                  className="h-4 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: tour.color }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 text-[12px] font-medium leading-3">
                  {label}
                </span>
                {countStr ?
                  <span className="count">{countStr}</span>
                : null}
              </ArchivePrefetchLink>
            )
          })
        }
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
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center px-3 py-4 text-xs text-muted-foreground">
            Loading tours…
          </div>
        ) : tours.length === 0 ? (
          <div className="px-3 py-3 text-center text-xs text-muted-foreground">
            No tours found.
          </div>
        ) : (
          <ul className="divide-y divide-border/60 text-xs">
            {tours.map((tour) => {
              const [label, countPart] = tour.tour_count.split(" (")
              return (
                <li
                  key={tour.tour_id || tour.tour_count}
                  className="flex items-stretch"
                >
                  <div
                    className="w-1 shrink-0"
                    style={{ backgroundColor: tour.color }}
                  />
                  <div className="flex-1 px-2 py-1.5 leading-tight">
                    <ArchivePrefetchLink
                      href={getTourArchiveUrl(tour.tour_id)}
                      className="text-[11px] font-medium hover:underline"
                    >
                      {label}
                    </ArchivePrefetchLink>
                    {countPart ? (
                      <span className="ml-1 text-[10px] text-muted-foreground">
                        ({countPart.replace(")", "")})
                      </span>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

