"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import type { SetlistEntry } from "@/types/setlist"

interface SetlistSongSpreadCardProps {
  setlist: SetlistEntry[]
  hoveredCategory?: string | null
  onCategoryHover?: (category: string | null) => void
}

export function SetlistSongSpreadCard({
  setlist,
  hoveredCategory = null,
  onCategoryHover,
}: SetlistSongSpreadCardProps) {
  const spread = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const entry of setlist) {
      const cat = entry.song_category || "Other"
      counts[cat] = (counts[cat] ?? 0) + 1
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [setlist])

  if (spread.length === 0) {
    return (
      <Card className="border-border/60 bg-card/80 py-0">
        <CardContent className="p-3">
          <p className="text-xs font-medium text-foreground">Song spread</p>
          <p className="text-xs text-muted-foreground mt-1">No data</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60 bg-card/80 py-0">
      <CardContent className="p-3">
        <p className="text-xs font-medium text-foreground mb-2">Song spread</p>
        <ul className="space-y-1 text-xs">
          {spread.map(([category, count]) => (
            <li
              key={category}
              className={`flex justify-between gap-2 tabular-nums ${
                hoveredCategory === category
                  ? "bg-muted/80 rounded px-1 -mx-1"
                  : ""
              } ${onCategoryHover ? "cursor-default" : ""}`}
              onMouseEnter={() => onCategoryHover?.(category)}
              onMouseLeave={() => onCategoryHover?.(null)}
            >
              <span className="text-muted-foreground truncate">{category}</span>
              <span className="font-medium text-foreground shrink-0">
                {count}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
