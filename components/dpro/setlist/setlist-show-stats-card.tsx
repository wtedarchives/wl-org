"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { Show } from "@/types/setlist"
import { formatEntryLength } from "@/lib/setlist-utils"

interface SetlistShowStatsCardProps {
  show: Show
  setlistLength: number
  totalLengthFromSetlist: string | null
  showLengthRank: number | null
}

function formatShowLength(value: string | null | undefined): string {
  if (!value) return "—"
  if (typeof value !== "string") return "—"
  if (value.includes(":") || /^\d+$/.test(value)) return formatEntryLength(value)
  return value
}

export function SetlistShowStatsCard({
  show,
  setlistLength,
  totalLengthFromSetlist,
  showLengthRank,
}: SetlistShowStatsCardProps) {
  const displayLength =
    formatShowLength(show.show_length) || totalLengthFromSetlist || "—"

  return (
    <Card className="border-border/60 bg-card/80 py-0">
      <CardContent className="p-3">
        <p className="text-xs font-medium text-foreground mb-2">Show Stats</p>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li className="flex justify-between gap-2">
            <span>Songs</span>
            <span className="tabular-nums font-medium text-foreground">
              {setlistLength}
            </span>
          </li>
          <li className="flex justify-between gap-2">
            <span>Length</span>
            <span className="tabular-nums font-medium text-foreground">
              {displayLength}
            </span>
          </li>
          {showLengthRank != null && (
            <li className="flex justify-between gap-2">
              <span>Length rank</span>
              <span className="tabular-nums font-medium text-foreground">
                #{showLengthRank}
              </span>
            </li>
          )}
          {show.show_rarity != null && (
            <li className="flex justify-between gap-2">
              <span>Rarity</span>
              <span className="tabular-nums font-medium text-foreground">
                {Number(show.show_rarity).toFixed(2)}%
              </span>
            </li>
          )}
          {show.show_gap != null && (
            <li className="flex justify-between gap-2">
              <span>Gap</span>
              <span className="tabular-nums font-medium text-foreground">
                {Number(show.show_gap).toFixed(2)}
              </span>
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  )
}
