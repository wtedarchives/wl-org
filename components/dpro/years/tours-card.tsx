"use client"

import Link from "next/link"

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
}

export function ToursCard({
  tours,
  currentYear,
  loading,
  className,
}: ToursCardProps) {
  return (
    <Card
      className={cn(
        "ring-0 border border-border/60 bg-card/80 py-0",
        className
      )}
    >
      <CardHeader className="border-b border-border/50 py-2">
        <CardTitle className="text-sm font-semibold">
          {currentYear ? `${currentYear} Tours` : "Tours"}
        </CardTitle>
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
                    <Link
                      href={getTourArchiveUrl(tour.tour_id)}
                      className="text-[11px] font-medium hover:underline"
                    >
                      {label}
                    </Link>
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

