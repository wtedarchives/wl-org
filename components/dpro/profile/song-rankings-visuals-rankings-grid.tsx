"use client"

import Image from "next/image"

import { cn } from "@/lib/utils"

export type VisualRankingEntry = {
  rank: number
  song_id: string
  song: string
  categoryArtwork?: string | null
}

export function SongRankingsVisualsRankingsGrid({
  ranks,
  className,
}: {
  ranks: VisualRankingEntry[]
  className?: string
}) {
  if (ranks.length === 0) return null

  const sorted = [...ranks].sort((a, b) => a.rank - b.rank)

  return (
    <ol
      className={cn(
        "rankings-visuals-song-columns song-rankings-visuals-rankings-grid",
        className,
      )}
      aria-label="Song rankings"
    >
      {sorted.map((entry) => (
        <li
          key={entry.song_id}
          className="rankings-visuals-song-columns__item song-rankings-visuals-rankings-grid__item"
        >
          <span className="song-rankings-visuals-rankings-grid__rank" aria-hidden>
            {entry.rank}
          </span>
          {entry.categoryArtwork ?
            <span className="song-rankings-visuals-rankings-grid__art" aria-hidden>
              <Image
                src={entry.categoryArtwork}
                alt=""
                width={36}
                height={36}
                className="song-rankings-visuals-rankings-grid__art-img"
                unoptimized
              />
            </span>
          : null}
          <span className="song-rankings-visuals-rankings-grid__song">{entry.song}</span>
          <span className="sr-only">
            Rank {entry.rank}: {entry.song}
          </span>
        </li>
      ))}
    </ol>
  )
}
