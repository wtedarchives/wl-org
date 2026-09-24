"use client"

import { CaretDown, CaretUp, X } from "@phosphor-icons/react"

import {
  VOTE_PICK_LIMIT,
  getVoteSong,
} from "@/components/vote/colorado-run-setlists"

type VoteBallotProps = {
  pickIds: string[]
  submitted: boolean
  signedIn: boolean
  submitting: boolean
  error: string | null
  onMove: (index: number, direction: -1 | 1) => void
  onRemove: (index: number) => void
  onSubmit: () => void
  onSignIn: () => void
}

export function VoteBallot({
  pickIds,
  submitted,
  signedIn,
  submitting,
  error,
  onMove,
  onRemove,
  onSubmit,
  onSignIn,
}: VoteBallotProps) {
  const ready = pickIds.length === VOTE_PICK_LIMIT
  const emptySlots = VOTE_PICK_LIMIT - pickIds.length

  return (
    <aside className="vote-ballot" aria-label="Your top 10">
      <div className="vote-ballot__head">
        <h2 className="vote-ballot__title">Your top 10</h2>
        <p className="vote-ballot__count">
          {pickIds.length} of {VOTE_PICK_LIMIT}
        </p>
      </div>

      {submitted ? (
        <p className="vote-ballot__note" role="status">
          Your vote is in. One ballot per account.
        </p>
      ) : !signedIn ? (
        <p className="vote-ballot__note">
          Sign in with your Wysteria Lane account to pick moments. You can vote
          once.
        </p>
      ) : null}

      {error ? (
        <p className="vote-ballot__error" role="alert">
          {error}
        </p>
      ) : null}

      <ol className="vote-ballot__list">
        {pickIds.map((id, index) => {
          const entry = getVoteSong(id)
          if (!entry) return null
          const { song, show } = entry
          return (
            <li key={id} className="vote-ballot__row">
              <span className="vote-ballot__rank">{index + 1}</span>
              <span className="vote-ballot__song">
                <span className="vote-ballot__name">{song.name}</span>
                <span className="vote-ballot__meta">
                  {show.dateLabel} [{show.location}]
                </span>
              </span>
              {submitted ? null : (
                <span className="vote-ballot__actions">
                  <button
                    type="button"
                    className="vote-ballot__icon"
                    aria-label={`Move ${song.name}, ${show.dateLabel} set ${song.set} number ${song.num}, up`}
                    disabled={index === 0}
                    onClick={() => onMove(index, -1)}
                  >
                    <CaretUp size={18} weight="bold" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="vote-ballot__icon"
                    aria-label={`Move ${song.name}, ${show.dateLabel} set ${song.set} number ${song.num}, down`}
                    disabled={index === pickIds.length - 1}
                    onClick={() => onMove(index, 1)}
                  >
                    <CaretDown size={18} weight="bold" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="vote-ballot__icon vote-ballot__icon--remove"
                    aria-label={`Remove ${song.name}, ${show.dateLabel} set ${song.set} number ${song.num}`}
                    onClick={() => onRemove(index)}
                  >
                    <X size={16} weight="bold" aria-hidden />
                  </button>
                </span>
              )}
            </li>
          )
        })}
        {submitted
          ? null
          : Array.from({ length: emptySlots }, (_, slot) => (
              <li
                key={`empty-${slot}`}
                className="vote-ballot__row vote-ballot__row--empty"
                aria-hidden
              >
                <span className="vote-ballot__rank">
                  {pickIds.length + slot + 1}
                </span>
                <span className="vote-ballot__placeholder">Open spot</span>
              </li>
            ))}
      </ol>

      {submitted ? null : signedIn ? (
        <button
          type="button"
          className="vote-ballot__submit"
          disabled={!ready || submitting}
          onClick={onSubmit}
        >
          {submitting
            ? "Submitting…"
            : ready
              ? "Submit your top 10"
              : `Pick ${emptySlots} more to submit`}
        </button>
      ) : (
        <button type="button" className="vote-ballot__submit" onClick={onSignIn}>
          Sign in to vote
        </button>
      )}
    </aside>
  )
}
