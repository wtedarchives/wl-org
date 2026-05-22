"use client"

import type { RankingConfirmedRank } from "@/lib/ranking-engine-edge"
import { cn } from "@/lib/utils"

export interface SongRankingsChartProps {
  ranks: RankingConfirmedRank[]
  className?: string
}

export function SongRankingsChart({ ranks, className }: SongRankingsChartProps) {
  if (ranks.length === 0) return null

  const sorted = [...ranks].sort((a, b) => a.rank - b.rank)

  return (
    <ol className={cn("song-rankings-chart", className)} aria-label="Song rankings">
      {sorted.map((entry) => (
        <li key={entry.song_id} className="song-rankings-chart__row">
          <span className="song-rankings-chart__rank" aria-hidden>
            #{entry.rank}
          </span>
          <span className="song-rankings-chart__song">{entry.song}</span>
          <span className="sr-only">
            Rank {entry.rank}: {entry.song}
          </span>
        </li>
      ))}
    </ol>
  )
}
