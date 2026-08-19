"use client"

import { useEffect, useRef, useState } from "react"

import type { Song, SongPick } from "@/components/dpro/setlistgame/song-selection/types"
import {
  EchoPicksBank,
  EchoPicksSearchField,
  EchoPicksSearchResults,
} from "@/components/echo-of-a-show/echo-of-a-show-picks-bank"
import { EchoPicksBoard } from "@/components/echo-of-a-show/echo-of-a-show-picks-board"
import { EchoPicksRail } from "@/components/echo-of-a-show/echo-of-a-show-picks-rail"
import { EchoPicksSongRow } from "@/components/echo-of-a-show/echo-of-a-show-picks-row"
import type { SongStat } from "@/hooks/use-setlist-game-show-data"
import {
  echoAddColumn,
  echoAllSongs,
  echoAppendSong,
  echoBoardSets,
  echoCanAddColumn,
  echoMovePick,
  echoPickedSongSet,
  echoSongsInSet,
} from "@/lib/echo-of-a-show-editor"
import { getSetDisplayName } from "@/components/dpro/setlistgame/song-selection/utils"

type DragState =
  | { kind: "song"; song: string }
  | { kind: "pick"; id: string }
  | null

export function EchoPicksEditor({
  songs,
  picks,
  setPicks,
  currentSet,
  setCurrentSet,
  topSongs,
  submitting,
  error,
  success,
  isEditing,
  onSubmit,
  onClear,
  onRenumber,
}: {
  songs: Song[]
  picks: SongPick[]
  setPicks: (next: SongPick[]) => void
  currentSet: string
  setCurrentSet: (set: string) => void
  topSongs: SongStat[]
  submitting: boolean
  error: string | null
  success: boolean
  isEditing: boolean
  onSubmit: () => void
  onClear: () => void
  onRenumber: () => void
}) {
  const dragRef = useRef<DragState>(null)
  const [query, setQuery] = useState("")
  const [notice, setNotice] = useState<string | null>(null)
  const placeholder = `Search ${songs.length || ""} songs`.replace(
    "  songs",
    " songs",
  )

  useEffect(() => {
    if (!notice) return
    const id = window.setTimeout(() => setNotice(null), 2200)
    return () => window.clearTimeout(id)
  }, [notice])

  const addSong = (song: string, set = currentSet) => {
    const next = echoAppendSong(picks, song, set)
    if (next === "duplicate") {
      const already = echoPickedSongSet(picks, song)
      setNotice(
        already ? `Already in ${getSetDisplayName(already)}.` : "Already picked.",
      )
      return
    }
    setPicks(next)
    setCurrentSet(set)
    onRenumber()
  }

  const applyDrop = (set: string, beforePickId: string | null) => {
    const drag = dragRef.current
    dragRef.current = null
    if (!drag) return
    if (drag.kind === "song") {
      addSong(drag.song, set)
      return
    }
    setPicks(echoMovePick(picks, drag.id, set, beforePickId))
    setCurrentSet(set)
    onRenumber()
  }

  const removePick = (pickId: string) => {
    setPicks(picks.filter((pick) => pick.id !== pickId))
    onRenumber()
  }

  const addColumn = () => {
    const next = echoAddColumn(picks)
    if (!next) return
    setPicks(next.picks)
    setCurrentSet(next.currentSet)
  }

  const rail = (
    <EchoPicksRail
      picks={picks}
      submitting={submitting}
      error={error ?? notice}
      success={success}
      isEditing={isEditing}
      onSubmit={onSubmit}
      onClear={onClear}
    />
  )

  return (
    <div className="echo-picks">
      <div className="echo-picks__desktop">
        <EchoPicksBank
          songs={songs}
          picks={picks}
          topSongs={topSongs}
          placeholder={placeholder}
          onAdd={(song) => addSong(song)}
          onDragSong={(song) => {
            dragRef.current = { kind: "song", song }
          }}
        />
        <EchoPicksBoard
          picks={picks}
          currentSet={currentSet}
          onSelectSet={setCurrentSet}
          onAddColumn={addColumn}
          onDropOnSet={(set) => applyDrop(set, null)}
          onDropBefore={(set, beforeId) => applyDrop(set, beforeId)}
          onDragPick={(id) => {
            dragRef.current = { kind: "pick", id }
          }}
          onRemove={removePick}
        />
        {rail}
      </div>

      <div className="echo-picks__mobile">
        <div className="echo-picks__adding">
          <div className="echo-picks__kicker">Adding to</div>
          <div className="echo-picks__tabs">
            {echoBoardSets(picks).map((set) => (
              <button
                key={set}
                type="button"
                className={
                  set === currentSet
                    ? "echo-picks__tab echo-picks__tab--on"
                    : "echo-picks__tab"
                }
                onClick={() => setCurrentSet(set)}
              >
                {getSetDisplayName(set)}
              </button>
            ))}
            <button
              type="button"
              className="echo-picks__tab echo-picks__tab--add"
              onClick={addColumn}
              disabled={!echoCanAddColumn(picks)}
              aria-label="Add set"
            >
              +
            </button>
          </div>
          <EchoPicksSearchField
            query={query}
            onQuery={setQuery}
            placeholder="Search songs"
          />
        </div>
        <EchoPicksSearchResults
          songs={songs}
          picks={picks}
          query={query}
          onAdd={(song) => addSong(song)}
        />
        <div className="echo-picks__mobile-set">
          <div className="echo-picks__board-head">
            <span className="echo-picks__kicker">
              {getSetDisplayName(currentSet)} ·{" "}
              {echoSongsInSet(picks, currentSet).length} songs
            </span>
            <span className="echo-picks__hint">Drag to reorder</span>
          </div>
          <div className="echo-picks__col">
            {echoSongsInSet(picks, currentSet).map((pick) => (
              <EchoPicksSongRow
                key={pick.id}
                pick={pick}
                picks={picks}
                onRemove={() => removePick(pick.id)}
                onDragStart={(id) => {
                  dragRef.current = { kind: "pick", id }
                }}
                onDropBefore={(beforeId) => applyDrop(currentSet, beforeId)}
              />
            ))}
            {echoAllSongs(picks).length === 0 ?
              <p className="echo-picks__empty">No songs in this set yet.</p>
            : null}
          </div>
        </div>
        {rail}
      </div>
    </div>
  )
}
