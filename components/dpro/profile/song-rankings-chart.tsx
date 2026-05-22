"use client"

import type { RankingConfirmedRank } from "@/lib/ranking-engine-edge"
import { cn } from "@/lib/utils"

export interface SongRankingsChartProps {
  totalSlots: number
  confirmedRanks: RankingConfirmedRank[]
  showEmptySlots?: boolean
  className?: string
}

export function SongRankingsChart({
  totalSlots,
  confirmedRanks,
  showEmptySlots = true,
  className,
}: SongRankingsChartProps) {
  if (totalSlots <= 0) return null

  const rankByNumber = new Map(confirmedRanks.map((entry) => [entry.rank, entry]))

  return (
    <ol
      className={cn("song-rankings-chart", className)}
      aria-label="Song rankings"
    >
      {Array.from({ length: totalSlots }, (_, index) => {
        const rank = index + 1
        const entry = rankByNumber.get(rank)
        const isConfirmed = Boolean(entry)

        return (
          <li
            key={rank}
            className={cn(
              "song-rankings-chart__row",
              isConfirmed ?
                "song-rankings-chart__row--confirmed"
              : "song-rankings-chart__row--pending",
            )}
          >
            <span className="song-rankings-chart__rank" aria-hidden>
              #{rank}
            </span>
            <span className="song-rankings-chart__song">
              {isConfirmed ? entry!.song : "—"}
            </span>
            {!showEmptySlots && !isConfirmed ? null : (
              <span className="sr-only">
                {isConfirmed ? `Rank ${rank}: ${entry!.song}` : `Rank ${rank}: not yet ranked`}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
