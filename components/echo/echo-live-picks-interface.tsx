"use client"

import { useMemo, useState } from "react"
import { CaretDown, CaretUp, Plus, Trash, X } from "@phosphor-icons/react"

import { SongSelectionPlacementPill } from "@/components/dpro/setlistgame/song-selection/song-selection-placement-pill"
import {
  useEchoLivePicksEditor,
  type EchoLiveExistingPick,
} from "@/hooks/use-echo-live-picks-editor"
import { useSetlistGameSongs } from "@/hooks/use-setlist-game-songs"
import { groupSetlistGameSongsByCategory } from "@/lib/setlist-game-song-search"
import { echoTourSurfaceBgStyle } from "@/lib/echo-tour-surface-bg"
import { cn } from "@/lib/utils"

type EchoLivePicksInterfaceProps = {
  showId: string
  showTime: string
  showScored: boolean
  submissionId: string | null
  existingPicks: EchoLiveExistingPick[]
  onSubmitSuccess: () => void
}

export function EchoLivePicksInterface({
  showId,
  showTime,
  showScored,
  submissionId,
  existingPicks,
  onSubmitSuccess,
}: EchoLivePicksInterfaceProps) {
  const [query, setQuery] = useState("")
  const { songs, loading, error: songsError } = useSetlistGameSongs()
  const editor = useEchoLivePicksEditor({
    showId,
    showTime,
    showScored,
    submissionId,
    existingPicks,
    onSubmitSuccess,
  })

  const songGroups = useMemo(
    () => groupSetlistGameSongsByCategory(songs, query),
    [query, songs],
  )

  const totalHits = useMemo(
    () => songGroups.reduce((n, group) => n + group.songs.length, 0),
    [songGroups],
  )

  const uniqueSets = editor.getUniqueSets(editor.songPicks)
  const hasPicks = editor.songPicks.some((pick) => !pick.isBreak)
  const canRemoveSets = uniqueSets.length > 1

  return (
    <div className="echo-live-picks">
      <div className="echo-live-picks-grid">
        <div
          className="echo-live-card echo-live-picks-search"
          style={echoTourSurfaceBgStyle("live-picks-search")}
        >
          <div className="echo-tour-kicker echo-live-picks-search-kicker">
            Find a song
          </div>
          <input
            type="search"
            className="echo-live-picks-search-input"
            placeholder="Search the catalog"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search the catalog"
            autoComplete="off"
          />

          <div
            className="echo-live-picks-results"
            role="listbox"
            aria-label="Song search results"
          >
            {loading ?
              <p className="echo-live-picks-no-results">Loading songs…</p>
            : songsError ?
              <p className="echo-live-picks-no-results">{songsError}</p>
            : totalHits === 0 ?
              <p className="echo-live-picks-no-results">
                {query.trim().length > 0 ?
                  <>No songs match &quot;{query.trim()}&quot;.</>
                : <>No songs available.</>}
              </p>
            : songGroups.map((group) => (
                <div
                  key={group.category}
                  className="echo-live-picks-category-block"
                >
                  <div
                    className="echo-live-picks-category-label"
                    aria-hidden
                  >
                    {group.category}
                  </div>
                  {group.songs.map((song) => {
                    const isDrafted = editor.draftedSongNames.has(song.song)
                    return (
                      <button
                        key={song.song_id}
                        type="button"
                        role="option"
                        aria-selected={false}
                        className={cn(
                          "echo-live-picks-result",
                          isDrafted && "is-drafted",
                        )}
                        disabled={isDrafted}
                        onClick={() => editor.addSongFromCatalog(song.song)}
                      >
                        <span className="echo-live-picks-result-song">
                          {song.song}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ))}
          </div>

          <div className="echo-live-picks-divider" aria-hidden />

          <div className="echo-live-picks-action-grid">
            <button
              type="button"
              className="echo-live-picks-action-tile echo-live-picks-action-tile--amber"
              disabled={!editor.canAddSetBreak}
              onClick={editor.handleAddSetBreak}
            >
              Add Set Break
            </button>
            <button
              type="button"
              className="echo-live-picks-action-tile echo-live-picks-action-tile--rose"
              disabled={!editor.canAddEncoreBreak}
              onClick={editor.handleAddEncoreBreak}
            >
              Add Encore Break
            </button>
            <button
              type="button"
              className="echo-live-picks-action-tile echo-live-picks-action-tile--emerald"
              onClick={editor.handleAddNewOriginalSong}
            >
              <Plus size={14} weight="bold" aria-hidden />
              New Original Song
            </button>
            <button
              type="button"
              className="echo-live-picks-action-tile echo-live-picks-action-tile--sky"
              onClick={editor.handleAddNewCoverSong}
            >
              <Plus size={14} weight="bold" aria-hidden />
              New Cover Song
            </button>
          </div>
        </div>

        <div className="echo-live-picks-draft-col">
          <div
            className="echo-live-card echo-live-picks-draft"
            style={echoTourSurfaceBgStyle("live-picks-draft")}
          >
            <h2 className="echo-live-picks-draft-title">Your picks</h2>

            {!hasPicks ?
              <p className="echo-live-picks-draft-empty">
                Pick songs to build your setlist.
              </p>
            : <>
                {uniqueSets.map((setId) => {
                  const setPicks = editor.getSongsForSet(editor.songPicks, setId)

                  return (
                    <div key={setId} className="echo-live-picks-set-block">
                      <div className="echo-live-picks-set-head">
                        <span className="echo-tour-kicker echo-live-picks-set-kicker">
                          {editor.getSetDisplayName(setId)}
                        </span>
                        {canRemoveSets ?
                          <button
                            type="button"
                            className="echo-live-picks-set-delete"
                            aria-label={`Remove ${editor.getSetDisplayName(setId)}`}
                            onClick={() => editor.handleRemoveSet(setId)}
                          >
                            <Trash size={14} weight="bold" aria-hidden />
                          </button>
                        : null}
                      </div>
                      <div
                        className={cn(
                          "echo-live-picks-dropzone",
                          setPicks.length === 0 && "is-empty",
                        )}
                      >
                        {setPicks.length === 0 ?
                          <p className="echo-live-picks-dropzone-empty">
                            No songs in this set yet
                          </p>
                        : setPicks.map((pick, index) => {
                            const showPlacement =
                              pick.placement &&
                              !pick.placement.startsWith("Main Set")

                            return (
                              <div
                                key={pick.id}
                                className="echo-live-picks-draft-row"
                              >
                                <span className="echo-live-picks-draft-n">
                                  {index + 1}
                                </span>
                                <span className="echo-live-picks-draft-song">
                                  {pick.song}
                                </span>
                                {showPlacement ?
                                  <SongSelectionPlacementPill
                                    placement={pick.placement}
                                  >
                                    {pick.placement}
                                  </SongSelectionPlacementPill>
                                : null}
                                <div className="echo-live-picks-row-move">
                                  <button
                                    type="button"
                                    className="echo-live-picks-row-btn"
                                    aria-label={`Move ${pick.song} up`}
                                    onClick={() => editor.moveSongUp(pick.id)}
                                  >
                                    <CaretUp size={12} weight="bold" />
                                  </button>
                                  <button
                                    type="button"
                                    className="echo-live-picks-row-btn"
                                    aria-label={`Move ${pick.song} down`}
                                    onClick={() =>
                                      editor.moveSongDown(pick.id)
                                    }
                                  >
                                    <CaretDown size={12} weight="bold" />
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  className="echo-live-picks-row-btn is-remove"
                                  aria-label={`Remove ${pick.song}`}
                                  onClick={() => {
                                    const pickIndex = editor.songPicks.findIndex(
                                      (p) => p.id === pick.id,
                                    )
                                    if (pickIndex >= 0) {
                                      editor.handleRemoveSong(pickIndex)
                                    }
                                  }}
                                >
                                  <X size={12} weight="bold" aria-hidden />
                                </button>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )
                })}
              </>
            }

            <div className="echo-live-picks-actions">
              {editor.error ?
                <p className="echo-live-picks-error echo-live-picks-submit-error">
                  {editor.error}
                </p>
              : null}
              <button
                type="button"
                className="echo-tour-btn-ghost"
                disabled={!hasPicks}
                onClick={editor.clearAll}
              >
                Clear all
              </button>
              <button
                type="button"
                className="echo-tour-btn-primary"
                disabled={!hasPicks || editor.submitting || editor.success}
                onClick={() => void editor.handleSubmit()}
              >
                {editor.submitting ?
                  "Submitting…"
                : editor.success ?
                  "Submitted!"
                : editor.isEditing ?
                  "Update picks"
                : "Submit picks"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
