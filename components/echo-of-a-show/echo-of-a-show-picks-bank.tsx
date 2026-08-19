"use client"

import { useMemo, useState } from "react"

import { SongDisplayName } from "@/components/dpro/song-display-name"
import type { Song } from "@/components/dpro/setlistgame/song-selection/types"
import type { SongStat } from "@/hooks/use-setlist-game-show-data"
import {
  ECHO_WILDCARD_COVER,
  ECHO_WILDCARD_ORIGINAL,
  echoPickedSongSet,
  isEchoWildcard,
} from "@/lib/echo-of-a-show-editor"
import { getSetDisplayName } from "@/components/dpro/setlistgame/song-selection/utils"
import type { SongPick } from "@/components/dpro/setlistgame/song-selection/types"

const CATEGORY_ORDER = ["Goose", "Ted Tapes", "Cover Songs"] as const

function categoryLabel(categoryType: string | undefined): string {
  if (categoryType === "Goose" || categoryType === "Goose Misc") return "Goose"
  if (categoryType === "Ted Tapes") return "Ted Tapes"
  if (categoryType === "Cover Songs") return "Cover Songs"
  return "Other"
}

function matchesQuery(song: Song, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return (
    song.song.toLowerCase().includes(needle) ||
    (song.song_displayname ?? "").toLowerCase().includes(needle)
  )
}

export function EchoPicksBank({
  songs,
  picks,
  topSongs,
  onAdd,
  onDragSong,
  placeholder,
}: {
  songs: Song[]
  picks: SongPick[]
  topSongs: SongStat[]
  onAdd: (song: string) => void
  onDragSong: (song: string) => void
  placeholder: string
}) {
  const [query, setQuery] = useState("")
  const searching = query.trim().length > 0

  const groups = useMemo(() => {
    if (!searching) return []
    return CATEGORY_ORDER.flatMap((category) => {
      const matched = songs
        .filter((song) => categoryLabel(song.category_type) === category)
        .filter((song) => matchesQuery(song, query))
        .slice(0, 40)
      return matched.length > 0 ? [{ category, songs: matched }] : []
    })
  }, [query, searching, songs])

  const showWildcards =
    !searching || "new original cover song".includes(query.trim().toLowerCase())

  return (
    <div className="echo-picks__bank">
      <div className="echo-picks__kicker">Song bank</div>
      <div className="echo-picks__search">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
        />
      </div>

      <div className="echo-picks__bank-list">
        {searching ?
          groups.length === 0 ?
            <p className="echo-picks__empty">No songs match that search.</p>
          : groups.map((group) => (
              <div key={group.category}>
                <div className="echo-picks__group">{group.category}</div>
                {group.songs.map((song) => (
                  <BankRow
                    key={song.song_id}
                    song={song.song}
                    displayName={song.song_displayname}
                    picks={picks}
                    onAdd={onAdd}
                    onDragSong={onDragSong}
                  />
                ))}
              </div>
            ))
        : <>
            {topSongs.length > 0 ?
              <>
                <div className="echo-picks__group">Most picked here</div>
                {topSongs.slice(0, 8).map((stat) => (
                  <BankRow
                    key={stat.song}
                    song={stat.song}
                    displayName={stat.song_displayname}
                    meta={`${stat.percentage}%`}
                    picks={picks}
                    onAdd={onAdd}
                    onDragSong={onDragSong}
                  />
                ))}
              </>
            : null}
            {showWildcards ?
              <>
                <div className="echo-picks__group">Wildcards</div>
                <BankRow
                  song={ECHO_WILDCARD_ORIGINAL}
                  picks={picks}
                  onAdd={onAdd}
                  onDragSong={onDragSong}
                  dashed
                />
                <BankRow
                  song={ECHO_WILDCARD_COVER}
                  picks={picks}
                  onAdd={onAdd}
                  onDragSong={onDragSong}
                  dashed
                />
              </>
            : null}
          </>}
      </div>
    </div>
  )
}

function BankRow({
  song,
  displayName,
  meta,
  picks,
  onAdd,
  onDragSong,
  dashed = false,
}: {
  song: string
  displayName?: string | null
  meta?: string
  picks: SongPick[]
  onAdd: (song: string) => void
  onDragSong: (song: string) => void
  dashed?: boolean
}) {
  const already = echoPickedSongSet(picks, song)
  const inSet = already ? getSetDisplayName(already) : null

  return (
    <button
      type="button"
      className={
        already
          ? "echo-picks__bank-row echo-picks__bank-row--in"
          : dashed
            ? "echo-picks__bank-row echo-picks__bank-row--dash"
            : "echo-picks__bank-row"
      }
      draggable={!already || isEchoWildcard(song)}
      onDragStart={(event) => {
        if (already && !isEchoWildcard(song)) {
          event.preventDefault()
          return
        }
        event.dataTransfer.effectAllowed = "copy"
        event.dataTransfer.setData("text/plain", song)
        onDragSong(song)
      }}
      onClick={() => onAdd(song)}
    >
      <span className="echo-picks__grip echo-picks__grip--bank" aria-hidden>
        ⋮⋮
      </span>
      <span className="echo-picks__bank-name">
        <SongDisplayName
          song={song}
          songDisplayName={displayName}
          underlineOnHover={false}
        />
      </span>
      {inSet ?
        <span className="echo-picks__bank-meta">already in {inSet}</span>
      : meta ?
        <span className="echo-picks__bank-meta">{meta}</span>
      : null}
      <span className="echo-picks__add-mark" aria-hidden>
        {already && !isEchoWildcard(song) ? "✓" : "+"}
      </span>
    </button>
  )
}

export function EchoPicksSearchResults({
  songs,
  picks,
  query,
  onAdd,
}: {
  songs: Song[]
  picks: SongPick[]
  query: string
  onAdd: (song: string) => void
}) {
  const needle = query.trim().toLowerCase()
  const searching = needle.length > 0
  const groups = CATEGORY_ORDER.flatMap((category) => {
    const matched = songs
      .filter((song) => categoryLabel(song.category_type) === category)
      .filter((song) => (searching ? matchesQuery(song, query) : false))
      .slice(0, 20)
    return matched.length > 0 ? [{ category, songs: matched }] : []
  })
  const showWildcards =
    !searching || "new original cover song".includes(needle)

  if (!searching && !showWildcards) return null

  return (
    <div className="echo-picks__results">
      {searching && groups.length === 0 ?
        <p className="echo-picks__empty">No songs match that search.</p>
      : null}
      {groups.map((group) => (
        <div key={group.category}>
          <div className="echo-picks__group">{group.category}</div>
          {group.songs.map((song) => (
            <BankRow
              key={song.song_id}
              song={song.song}
              displayName={song.song_displayname}
              picks={picks}
              onAdd={onAdd}
              onDragSong={() => undefined}
            />
          ))}
        </div>
      ))}
      {showWildcards ?
        <>
          <div className="echo-picks__group">Wildcards</div>
          <BankRow
            song={ECHO_WILDCARD_ORIGINAL}
            picks={picks}
            onAdd={onAdd}
            onDragSong={() => undefined}
            dashed
          />
          <BankRow
            song={ECHO_WILDCARD_COVER}
            picks={picks}
            onAdd={onAdd}
            onDragSong={() => undefined}
            dashed
          />
        </>
      : null}
    </div>
  )
}

export function EchoPicksSearchField({
  query,
  onQuery,
  placeholder,
}: {
  query: string
  onQuery: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="echo-picks__search">
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        value={query}
        onChange={(event) => onQuery(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
    </div>
  )
}
