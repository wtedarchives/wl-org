"use client"

import { COLORADO_RUN_SHOWS } from "@/components/vote/colorado-run-setlists"

type VoteSetlistsProps = {
  ranks: Map<string, number>
  locked: boolean
  signedIn: boolean
  canAdd: boolean
  onToggle: (songId: string) => void
}

export function VoteSetlists({
  ranks,
  locked,
  signedIn,
  canAdd,
  onToggle,
}: VoteSetlistsProps) {
  return (
    <div className="vote-setlists">
      {COLORADO_RUN_SHOWS.map((show) => (
        <section key={show.id} className="vote-show" aria-labelledby={show.id}>
          <header className="vote-show__head">
            <h2 id={show.id} className="vote-show__date">
              {show.dateLabel} [{show.location}]
            </h2>
            <p className="vote-show__venue">{show.venue}</p>
          </header>
          <ul className="vote-show__songs">
              {show.songs.map((song) => {
                const rank = ranks.get(song.id)
                const selected = rank != null
                const disabled =
                  locked || (signedIn && !selected && !canAdd)
                return (
                  <li key={song.id}>
                    <button
                      type="button"
                      className={
                        "vote-song" + (selected ? " vote-song--picked" : "")
                      }
                      aria-pressed={selected}
                      disabled={disabled}
                      onClick={() => onToggle(song.id)}
                    >
                      <span className="vote-song__name">{song.name}</span>
                      <span className="vote-song__rank">
                        {selected ? rank : ""}
                      </span>
                    </button>
                  </li>
                )
              })}
          </ul>
        </section>
      ))}
    </div>
  )
}
