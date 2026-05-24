"use client"

import Image from "next/image"

import { SongRankingsProgress } from "@/components/dpro/profile/song-rankings-progress"
import { cn } from "@/lib/utils"

export type VisualRankingSong = {
  song_id: string
  song: string
  categoryArtwork?: string | null
}

export interface SongRankingsVisualsVoteCardsProps {
  song1: VisualRankingSong
  song2: VisualRankingSong
  voting: boolean
  onPick?: (winnerId: string, loserId: string) => void
}

function VoteCard({
  song,
  disabled,
  onClick,
}: {
  song: VisualRankingSong
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="song-rankings-vote__card song-rankings-visuals-vote__card"
      disabled={disabled}
      onClick={onClick}
    >
      {song.categoryArtwork ?
        <span className="song-rankings-visuals-vote__art" aria-hidden>
          <Image
            src={song.categoryArtwork}
            alt=""
            width={36}
            height={36}
            className="song-rankings-visuals-vote__art-img"
            unoptimized
          />
        </span>
      : null}
      <span className="song-rankings-vote__card-label">{song.song}</span>
    </button>
  )
}

export function SongRankingsVisualsVoteCards({
  song1,
  song2,
  voting,
  onPick,
}: SongRankingsVisualsVoteCardsProps) {
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
        <VoteCard
          song={song1}
          disabled={voting}
          onClick={() => onPick?.(song1.song_id, song2.song_id)}
        />
        <span className="song-rankings-vote__vs" aria-hidden>
          vs
        </span>
        <VoteCard
          song={song2}
          disabled={voting}
          onClick={() => onPick?.(song2.song_id, song1.song_id)}
        />
      </div>
      {voting ?
        <SongRankingsProgress active />
      : null}
    </div>
  )
}
