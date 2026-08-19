"use client"

import type { SongPick } from "@/components/dpro/setlistgame/song-selection/types"
import { EchoPicksSongRow } from "@/components/echo-of-a-show/echo-of-a-show-picks-row"
import {
  echoBoardSets,
  echoCanAddColumn,
  echoSongsInSet,
} from "@/lib/echo-of-a-show-editor"
import { getSetDisplayName } from "@/components/dpro/setlistgame/song-selection/utils"

export function EchoPicksBoard({
  picks,
  currentSet,
  onSelectSet,
  onAddColumn,
  onDropOnSet,
  onDropBefore,
  onDragPick,
  onRemove,
}: {
  picks: SongPick[]
  currentSet: string
  onSelectSet: (set: string) => void
  onAddColumn: () => void
  onDropOnSet: (set: string) => void
  onDropBefore: (set: string, beforePickId: string) => void
  onDragPick: (pickId: string) => void
  onRemove: (pickId: string) => void
}) {
  const sets = echoBoardSets(picks)

  return (
    <div className="echo-picks__board">
      <div className="echo-picks__board-head">
        <span className="echo-picks__kicker">Drag songs into a set</span>
        <button
          type="button"
          className="echo-picks__add-set"
          onClick={onAddColumn}
          disabled={!echoCanAddColumn(picks)}
        >
          + Add set
        </button>
      </div>
      <div className="echo-picks__cols">
        {sets.map((set) => {
          const songs = echoSongsInSet(picks, set)
          const active = set === currentSet
          return (
            <section
              key={set}
              className={
                active
                  ? "echo-picks__col echo-picks__col--on"
                  : "echo-picks__col"
              }
              onClick={() => onSelectSet(set)}
              onDragOver={(event) => {
                event.preventDefault()
                event.dataTransfer.dropEffect = "copy"
              }}
              onDrop={(event) => {
                event.preventDefault()
                onDropOnSet(set)
              }}
            >
              <div className="echo-picks__col-head">
                <span>{getSetDisplayName(set)}</span>
                <span>{songs.length}</span>
              </div>
              {songs.map((pick) => (
                  <EchoPicksSongRow
                    key={pick.id}
                    pick={pick}
                    picks={picks}
                    onRemove={() => onRemove(pick.id)}
                    onDragStart={onDragPick}
                    onDropBefore={(beforeId) => onDropBefore(set, beforeId)}
                  />
              ))}
              <div className="echo-picks__drop">Drop here</div>
            </section>
          )
        })}
      </div>
      <p className="echo-picks__legend">
        <span>
          <i data-placement-bar="set-1-opener" />
          Show opener +3
        </span>
        <span>
          <i data-placement-bar="set-opener" />
          Set opener
        </span>
        <span>
          <i data-placement-bar="set-closer" />
          Set closer
        </span>
        <span>
          <i data-placement-bar="encore-1" />
          Encore
        </span>
        <span>
          <i data-placement-bar="encore-23" />
          Encore 2/3
        </span>
        <span className="echo-picks__legend-note">
          Placement follows position — first and last song in a set become its
          opener and closer.
        </span>
      </p>
    </div>
  )
}