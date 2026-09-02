"use client"

import { useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { groupSetlistGameSongsByCategory } from "@/lib/setlist-game-song-search"
import type { Song } from "./types"

interface SongSearchCardProps {
  songs: Song[]
  selectedSong: string
  setSelectedSong: (song: string) => void
  onAddSong: () => void
  error: string | null
  /** Match WL Home v2 tours / archive widget-panel chrome inside the song-selection modal */
  wlHomeV2Chrome?: boolean
}

export function SongSearchCard({
  songs,
  selectedSong,
  setSelectedSong,
  onAddSong,
  error,
  wlHomeV2Chrome = false,
}: SongSearchCardProps) {
  const [query, setQuery] = useState("")

  const filteredSongsByCategory = useMemo(
    () => groupSetlistGameSongsByCategory(songs, query),
    [songs, query],
  )

  const totalHits = useMemo(
    () => filteredSongsByCategory.reduce((n, g) => n + g.songs.length, 0),
    [filteredSongsByCategory],
  )

  const wlSearchBody = wlHomeV2Chrome ?
    (
      <div className="song-selection-archive-search-body">
        <div className="song-selection-archive-search-field-wrap">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            className="song-selection-archive-search-input"
            placeholder="Search songs…"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div
          className="song-selection-archive-search-results"
          role="listbox"
          aria-label="Song search results"
        >
          {totalHits === 0 ?
            <div className="song-selection-archive-search-empty">
              {query.trim().length > 0 ?
                <>No songs match &quot;{query}&quot;.</>
              : <>Type to filter songs.</>}
            </div>
          : filteredSongsByCategory.map((group) => (
              <div key={group.category} className="song-selection-archive-category-block">
                <div className="song-selection-archive-category-label" aria-hidden>
                  {group.category}
                </div>
                {group.songs.map((song) => {
                  const isSelected = selectedSong === song.song
                  return (
                    <button
                      key={song.song_id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={cn(
                        "song-selection-archive-result-row",
                        isSelected && "song-selection-archive-result-row--selected",
                      )}
                      onClick={() => setSelectedSong(song.song)}
                    >
                      <span className="song-selection-archive-result-title">
                        {song.song}
                      </span>
                    </button>
                  )
                })}
              </div>
            ))
          }
        </div>
      </div>
    )
  : null

  const legacyCommandBlock = (
    <Command className="h-auto overflow-hidden rounded-lg border border-border" shouldFilter={true}>
      <CommandInput placeholder="Type to search..." className="py-2 h-full text-xs" />
      <CommandList className="max-h-48">
        <CommandEmpty className="py-4 text-xs text-muted-foreground">
          No songs found.
        </CommandEmpty>
        {filteredSongsByCategory.map((group) => (
          <CommandGroup key={group.category} heading={group.category}>
            {group.songs.map((song) => (
              <CommandItem
                key={song.song_id}
                value={`${song.song} ${song.song_displayname ?? ""}`}
                onSelect={() => setSelectedSong(song.song)}
                className={cn(
                  "cursor-pointer text-xs py-0.5",
                  selectedSong === song.song && "bg-accent/80",
                )}
              >
                {song.song}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  )

  const addButton = (
    <Button
      size="sm"
      onClick={onAddSong}
      disabled={!selectedSong}
      className={cn(
        "w-full",
        wlHomeV2Chrome && "song-selection-submit-primary song-selection-add-song-btn",
      )}
    >
      <Plus className="size-4 shrink-0" aria-hidden />
      Add Song
    </Button>
  )

  const errorLine =
    error ?
      <p
        className={cn(
          "text-xs font-medium",
          wlHomeV2Chrome ? "song-selection-command-error" : "text-destructive",
        )}
      >
        {error}
      </p>
    : null

  if (wlHomeV2Chrome) {
    return (
      <div className="widget-panel song-selection-tour-panel song-selection-form-panel">
        <div className="wp-head song-selection-form-panel-head song-selection-search-wp-head">
          <span className="song-selection-search-heading-label">Search songs</span>
          {selectedSong ?
            <div className="song-selection-inline-pick-badge-wrap">
              <span className="song-selection-inline-pick-badge">{selectedSong}</span>
            </div>
          : null}
        </div>
        <div className="song-selection-form-panel-body">
          {wlSearchBody}
          {addButton}
          {errorLine}
        </div>
      </div>
    )
  }

  return (
    <Card className="ring-0 border border-border/60 bg-card/80 overflow-hidden py-0">
      <CardHeader className="py-2 px-3">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <CardTitle className="text-sm font-medium whitespace-nowrap shrink-0">
            Search songs
          </CardTitle>
          {selectedSong && (
            <Badge
              variant="secondary"
              className="shrink min-w-0 !max-w-[60%] overflow-hidden font-normal border-wl-orange/60 bg-wl-orange/60 text-white"
            >
              <span className="block min-w-0 max-w-full truncate">{selectedSong}</span>
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        {legacyCommandBlock}
        {addButton}
        {errorLine}
      </CardContent>
    </Card>
  )
}
