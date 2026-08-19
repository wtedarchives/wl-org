"use client"

import { SongDisplayName } from "@/components/dpro/song-display-name"
import type { SongPick } from "@/components/dpro/setlistgame/song-selection/types"
import { getPlacementBarCssToken } from "@/lib/placement-bar-color"
import {
  echoAllSongs,
  echoEditorPill,
  echoSongsInSet,
} from "@/lib/echo-of-a-show-editor"

export function EchoPicksSongRow({
  pick,
  picks,
  onRemove,
  onDragStart,
  onDropBefore,
}: {
  pick: SongPick
  picks: SongPick[]
  onRemove: () => void
  onDragStart: (pickId: string) => void
  onDropBefore: (beforePickId: string) => void
}) {
  const setSongs = echoSongsInSet(picks, pick.set)
  const allSongs = echoAllSongs(picks)
  const pill = echoEditorPill(pick, setSongs, allSongs)
  const barPlacement = pill?.placement ?? pick.placement
  const index = setSongs.findIndex((item) => item.id === pick.id)

  return (
    <div
      className="echo-picks__song"
      onDragOver={(event) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = "move"
      }}
      onDrop={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onDropBefore(pick.id)
      }}
    >
      <span
        className="echo-picks__bar"
        data-placement-bar={getPlacementBarCssToken(barPlacement)}
        aria-hidden
      />
      <span className="echo-picks__num">{index + 1}</span>
      <span className="echo-picks__song-name">
        <SongDisplayName song={pick.song} underlineOnHover={false} />
      </span>
      {pill ?
        <span
          className="echo-picks__pill"
          data-placement-bar={getPlacementBarCssToken(pill.placement)}
        >
          {pill.label}
        </span>
      : null}
      <button
        type="button"
        className="echo-picks__remove"
        onClick={onRemove}
        aria-label={`Remove ${pick.song}`}
      >
        ×
      </button>
      <span
        className="echo-picks__grip"
        draggable
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = "move"
          event.dataTransfer.setData("text/plain", pick.id)
          onDragStart(pick.id)
        }}
        aria-hidden
      >
        ⋮⋮
      </span>
    </div>
  )
}
