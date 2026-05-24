"use client"

import Image from "next/image"

import type { RankingSongRef } from "@/lib/ranking-engine-edge"

export interface SongRankingsUnrankedSectionProps {
  songs: RankingSongRef[]
  rankingNew?: boolean
  onRankNewSongs: () => void
}

export function SongRankingsUnrankedSection({
  songs,
  rankingNew = false,
  onRankNewSongs,
}: SongRankingsUnrankedSectionProps) {
  if (songs.length === 0) return null

  return (
    <section className="song-rankings-unranked" aria-label="Songs not yet ranked">
      <header className="song-rankings-unranked__header">
        <h3 className="song-rankings-unranked__title">New songs to rank</h3>
        <p className="song-rankings-unranked__description">
          These songs were added to the catalog after your last ranking session.
        </p>
      </header>
      <ul className="song-rankings-song-columns song-rankings-unranked__list">
        {songs.map((song) => (
          <li
            key={song.song_id}
            className="song-rankings-song-columns__item song-rankings-unranked__item"
          >
            {song.categoryArtwork ?
              <span className="song-rankings-unranked__art" aria-hidden>
                <Image
                  src={song.categoryArtwork}
                  alt=""
                  width={36}
                  height={36}
                  className="song-rankings-unranked__art-img"
                  unoptimized
                />
              </span>
            : null}
            <span className="song-rankings-unranked__song">{song.song}</span>
          </li>
        ))}
      </ul>
      <div className="song-rankings-unranked__actions">
        <button
          type="button"
          className="song-rankings-pill-button"
          disabled={rankingNew}
          onClick={onRankNewSongs}
        >
          {rankingNew ? "Starting…" : "Rank new songs"}
        </button>
      </div>
    </section>
  )
}
