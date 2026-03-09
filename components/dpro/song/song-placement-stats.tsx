"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SongPlacementPill } from "./song-placement-pill"
import type { PlacementStat } from "@/types/song"

interface SongPlacementStatsProps {
  placementStats: PlacementStat[]
}

export function SongPlacementStats({ placementStats }: SongPlacementStatsProps) {
  if (placementStats.length === 0) return null

  return (
    <Card className="border-border/60 bg-card/80 overflow-hidden py-0">
      <CardHeader className="bg-muted/60 py-2">
        <CardTitle className="text-sm font-semibold">Set Placements</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <SongPlacementPill placementStats={placementStats} />
      </CardContent>
    </Card>
  )
}
