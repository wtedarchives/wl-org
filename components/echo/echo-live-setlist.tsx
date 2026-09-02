"use client"

import type { EchoLiveSet } from "./echo-live-data"
import { EchoLiveScoreChip } from "./echo-live-score-chip"

export function EchoLiveSetlist({
  sets,
  showScores = false,
}: {
  sets: EchoLiveSet[]
  showScores?: boolean
}) {
  return (
    <>
      {sets.map((set) => (
        <div key={set.label} className="echo-live-set">
          <div className="echo-tour-kicker echo-live-set-label">
            {set.label}
          </div>
          <div className="echo-live-set-songs">
            {set.songs.map((song) => (
              <div
                key={`${set.label}-${song.n}-${song.title}`}
                className="echo-live-song"
                data-hit={showScores && song.hit ? "true" : undefined}
              >
                <span className="echo-live-song-n">{song.n}</span>
                <span className="echo-live-song-main">
                  <span className="echo-live-song-title">{song.title}</span>
                  {!showScores && song.short ?
                    <span className="echo-live-song-short">{song.short}</span>
                  : null}
                  {!showScores && song.segue ?
                    <span className="echo-live-song-segue">{song.segue}</span>
                  : null}
                </span>
                {showScores && song.tag ?
                  <span className="echo-live-song-tag">{song.tag}</span>
                : null}
                {showScores ?
                  <EchoLiveScoreChip song={song} />
                : null}
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}
