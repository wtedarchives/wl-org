"use client"

import { SongDisplayName } from "@/components/dpro/song-display-name"
import type { SongPick } from "@/components/dpro/setlistgame/song-selection/types"
import {
  echoAllSongs,
  echoWildcardCount,
} from "@/lib/echo-of-a-show-editor"
import { echoSetCount } from "@/lib/echo-of-a-show-picks"
import type { UserPick } from "@/hooks/use-user-picks"

function asUserPicks(picks: SongPick[]): UserPick[] {
  return echoAllSongs(picks).map((pick) => ({
    song: pick.song,
    set: pick.set,
    setnum: pick.setnum,
    placement: pick.placement,
  }))
}

export function EchoPicksRail({
  picks,
  submitting,
  error,
  success,
  isEditing,
  onSubmit,
  onClear,
}: {
  picks: SongPick[]
  submitting: boolean
  error: string | null
  success: boolean
  isEditing: boolean
  onSubmit: () => void
  onClear: () => void
}) {
  const songs = echoAllSongs(picks)
  const opener = songs[0]?.song ?? null
  const closer = songs[songs.length - 1]?.song ?? null
  const sets = echoSetCount(asUserPicks(picks))
  const wildcards = echoWildcardCount(picks)

  return (
    <aside className="echo-picks__rail">
      <div className="echo-picks__kicker">Your entry</div>
      <div className="echo-picks__count-row">
        <span className="echo-picks__count">{songs.length}</span>
        <span className="echo-picks__count-label">
          songs · {sets} {sets === 1 ? "set" : "sets"}
        </span>
      </div>
      <div className="echo-picks__facts">
        <div>
          <span>Show opener · first pick</span>
          <span>
            {opener ?
              <SongDisplayName song={opener} underlineOnHover={false} />
            : "—"}
          </span>
        </div>
        <div>
          <span>Show closer · last pick</span>
          <span>
            {closer ?
              <SongDisplayName song={closer} underlineOnHover={false} />
            : "—"}
          </span>
        </div>
        <div>
          <span>Wildcards</span>
          <span>{wildcards}</span>
        </div>
      </div>
      <p className="echo-picks__warn">
        Every pick over the songs actually played costs −3. Venue average lands
        in a later pass.
      </p>
      {error ?
        <p className="echo-picks__error">{error}</p>
      : null}
      {success ?
        <p className="echo-picks__ok">Picks submitted.</p>
      : null}
      <button
        type="button"
        className="echo-of-a-show__cta-btn echo-of-a-show__cta-btn--lg echo-picks__submit"
        onClick={onSubmit}
        disabled={submitting || songs.length === 0 || success}
      >
        {submitting ?
          "Submitting…"
        : isEditing ?
          "Update picks"
        : "Submit picks"}
      </button>
      <button
        type="button"
        className="echo-picks__clear"
        onClick={onClear}
        disabled={submitting || songs.length === 0}
      >
        Clear
      </button>
    </aside>
  )
}