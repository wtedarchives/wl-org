"use client"

import type { RankingProgress } from "@/lib/ranking-engine-edge"
import { cn } from "@/lib/utils"

export function SongRankingsProgressBar({
  progress,
  className,
}: {
  progress: RankingProgress
  className?: string
}) {
  const clampedPercent = Math.max(0, Math.min(100, progress.percent))

  return (
    <div className={cn("song-rankings-progress-bar", className)}>
      <div className="song-rankings-progress-bar__meta">
        <p className="song-rankings-progress-bar__label">
          {progress.placedSongs} of {progress.totalSongs} songs ranked
        </p>
        <p className="song-rankings-progress-bar__percent" aria-hidden>
          {clampedPercent}%
        </p>
      </div>
      <div
        className="song-rankings-progress-bar__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clampedPercent}
        aria-label={`${progress.placedSongs} of ${progress.totalSongs} songs ranked`}
      >
        <span
          className="song-rankings-progress-bar__fill"
          style={{ "--progress": `${clampedPercent}%` } as React.CSSProperties}
        />
      </div>
    </div>
  )
}
