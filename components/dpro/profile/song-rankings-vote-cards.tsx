"use client"

import { Loader2 } from "lucide-react"

import type { RankingSongRef } from "@/lib/ranking-engine-edge"
import { cn } from "@/lib/utils"

export interface SongRankingsVoteCardsProps {
  song1: RankingSongRef | null
  song2: RankingSongRef | null
  voting: boolean
  onPick: (winnerId: string, loserId: string) => void
}

export function SongRankingsVoteCards({
  song1,
  song2,
  voting,
  onPick,
}: SongRankingsVoteCardsProps) {
  if (!song1 || !song2) return null

  return (
    <div
      className={cn(
        "song-rankings-vote",
        voting && "song-rankings-vote--loading",
      )}
      aria-busy={voting}
    >
      <p className="song-rankings-vote__prompt">Which song do you prefer?</p>
      <div className="song-rankings-vote__cards">
        <button
          type="button"
          className="song-rankings-vote__card"
          disabled={voting}
          onClick={() => onPick(song1.song_id, song2.song_id)}
        >
          <span className="song-rankings-vote__card-label">{song1.song}</span>
        </button>
        <span className="song-rankings-vote__vs" aria-hidden>
          vs
        </span>
        <button
          type="button"
          className="song-rankings-vote__card"
          disabled={voting}
          onClick={() => onPick(song2.song_id, song1.song_id)}
        >
          <span className="song-rankings-vote__card-label">{song2.song}</span>
        </button>
      </div>
      <div
        className={cn(
          "song-rankings-vote__loading",
          voting && "song-rankings-vote__loading--visible",
        )}
        aria-hidden={!voting}
      >
        <Loader2 className="size-5 animate-spin" />
        <span>Loading next matchup…</span>
      </div>
    </div>
  )
}
