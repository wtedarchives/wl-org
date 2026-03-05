"use client"

import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAverageSetlist } from "@/hooks/use-average-setlist"
import type { YearShow } from "@/hooks/use-shows-data-by-year"
import { SetlistDisplay } from "./setlist-display"

interface AverageSetlistCardProps {
  shows: YearShow[]
  title: string
  className?: string
}

export function AverageSetlistCard({
  shows,
  title,
  className,
}: AverageSetlistCardProps) {
  const { averageSetlist, isLoading, error } = useAverageSetlist(
    shows,
    "year",
  )

  const cardClass = cn(
    "ring-0 border border-border/60 bg-card/80 py-0",
    className,
  )

  if (isLoading) {
    return (
      <Card className={cardClass}>
        <CardHeader className="border-b border-border/50 py-2">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center px-3 py-6 text-xs text-muted-foreground">
          Calculating average setlist…
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cardClass}>
        <CardHeader className="border-b border-border/50 py-2">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="px-3 py-4 text-center text-xs text-destructive">
          Error: {error}
        </CardContent>
      </Card>
    )
  }

  if (!averageSetlist || averageSetlist.length === 0) {
    return null
  }

  return (
    <Card className={cardClass}>
      <CardHeader className="border-b border-border/50 py-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="py-2">
        <SetlistDisplay setlist={averageSetlist} horizontalMargin="" />
      </CardContent>
    </Card>
  )
}

