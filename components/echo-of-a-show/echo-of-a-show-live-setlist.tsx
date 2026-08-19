"use client"

import { useState } from "react"

import { SongDisplayName } from "@/components/dpro/song-display-name"
import type { UserPick } from "@/hooks/use-user-picks"
import { getPlacementBarCssToken } from "@/lib/placement-bar-color"
import {
  echoActualForSet,
  echoLaterSetStarted,
  echoOrderedSets,
  echoPickLiveStatus,
  echoSetDisplayName,
  echoSetPoints,
  echoSongsForSet,
  type EchoActualEntry,
} from "@/lib/echo-of-a-show-live"

export function EchoOfAShowLiveSetlist({
  actual,
  picks,
}: {
  actual: EchoActualEntry[]
  picks: UserPick[]
}) {
  const [side, setSide] = useState<"picks" | "played">("picks")
  const sets = echoOrderedSets(picks, actual)

  if (actual.length === 0 && picks.length === 0) {
    return (
      <p className="echo-of-a-show__empty echo-of-a-show__empty--inset">
        Live setlist appears as songs are entered.
      </p>
    )
  }

  return (
    <div className="echo-live">
      <div className="echo-live__toggle" role="tablist" aria-label="Live setlist">
        <button
          type="button"
          role="tab"
          aria-selected={side === "picks"}
          className={
            side === "picks"
              ? "echo-live__toggle-btn echo-live__toggle-btn--on"
              : "echo-live__toggle-btn"
          }
          onClick={() => setSide("picks")}
        >
          Your picks
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={side === "played"}
          className={
            side === "played"
              ? "echo-live__toggle-btn echo-live__toggle-btn--on"
              : "echo-live__toggle-btn"
          }
          onClick={() => setSide("played")}
        >
          What was played
        </button>
      </div>

      {sets.map((setId) => {
        const setPicks = echoSongsForSet(picks, setId)
        const setActual = echoActualForSet(actual, setId)
        const live = !echoLaterSetStarted(actual, setId) && setActual.length > 0
        const points = echoSetPoints(picks, actual, setId)
        const name = echoSetDisplayName(setId)
        return (
          <section
            key={setId}
            className={
              live
                ? "echo-live__set echo-live__set--live"
                : "echo-live__set"
            }
          >
            <header className="echo-live__set-head echo-live__set-head--phone">
              <span>
                {name} Selections
                {live ? " · playing" : ""}
              </span>
              {points > 0 ?
                <span className="echo-live__pts">+{points}</span>
              : null}
            </header>
            <header className="echo-live__set-head echo-live__set-head--desk">
              <span>
                {name} Selections
                {live ? " · playing" : ""}
              </span>
              <span>
                Actual {name}
                {live ? " · in progress" : ""}
              </span>
            </header>
            <div className="echo-live__cols">
              <div
                className={
                  side === "picks"
                    ? "echo-live__col echo-live__col--picks"
                    : "echo-live__col echo-live__col--picks echo-live__col--hide-phone"
                }
              >
                {setPicks.length === 0 ?
                  <p className="echo-live__empty">No picks in this set.</p>
                : setPicks.map((pick) => {
                    const status = echoPickLiveStatus(pick, actual)
                    const token = getPlacementBarCssToken(pick.placement)
                    return (
                      <div key={`${pick.set}-${pick.setnum}-${pick.song}`} className="echo-live__row">
                        <span
                          className="echo-live__num"
                          data-placement-bar={token}
                        >
                          {pick.setnum}
                        </span>
                        <span
                          className={
                            status === "miss"
                              ? "echo-live__name echo-live__name--miss"
                              : "echo-live__name"
                          }
                        >
                          <SongDisplayName song={pick.song} underlineOnHover={false} />
                        </span>
                        {status === "hit" ?
                          <span className="echo-live__pts">
                            +{pick.score ?? 0}
                          </span>
                        : status === "miss" ?
                          <span className="echo-live__miss">✕</span>
                        : <span className="echo-live__out">still out</span>}
                      </div>
                    )
                  })}
              </div>
              <div
                className={
                  side === "played"
                    ? "echo-live__col echo-live__col--actual"
                    : "echo-live__col echo-live__col--actual echo-live__col--hide-phone"
                }
              >
                {setActual.map((entry) => (
                  <div key={entry.entry_id} className="echo-live__row">
                    <span
                      className="echo-live__num"
                      data-placement-bar={getPlacementBarCssToken(
                        entry.entry_placement,
                      )}
                    >
                      {entry.entry_setnum}
                    </span>
                    <span className="echo-live__name">
                      <SongDisplayName
                        song={entry.entry_song}
                        underlineOnHover={false}
                      />
                    </span>
                  </div>
                ))}
                {live ?
                  <div className="echo-live__row echo-live__row--wait">
                    <span className="echo-live__num echo-live__num--dash">
                      {setActual.length + 1}
                    </span>
                    <span className="echo-live__out">Waiting on the next entry</span>
                  </div>
                : setActual.length === 0 ?
                  <p className="echo-live__empty">Not started.</p>
                : null}
              </div>
            </div>
          </section>
        )
      })}
    </div>
  )
}
