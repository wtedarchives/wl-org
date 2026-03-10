"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Plus, ChevronDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Song } from "./types"

interface SongSelectorProps {
  songs: Song[]
  selectedSong: string
  setSelectedSong: (song: string) => void
  onAddSong: () => void
  onAddNewOriginalSong: () => void
  onAddNewCoverSong: () => void
  onAddSetBreak: () => void
  onAddEncoreBreak: () => void
  canAddSetBreak: boolean
  canAddEncoreBreak: boolean
  error: string | null
}

export function SongSelector({
  songs,
  selectedSong,
  setSelectedSong,
  onAddSong,
  onAddNewOriginalSong,
  onAddNewCoverSong,
  onAddSetBreak,
  onAddEncoreBreak,
  canAddSetBreak,
  canAddEncoreBreak,
  error,
}: SongSelectorProps) {
  const [isSongDropdownOpen, setIsSongDropdownOpen] = useState(false)
  const [songSearchTerm, setSongSearchTerm] = useState("")
  const songSearchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsSongDropdownOpen(false)
      }
    }
    if (isSongDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () =>
        document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isSongDropdownOpen])

  useEffect(() => {
    if (isSongDropdownOpen && songSearchInputRef.current) {
      setTimeout(() => songSearchInputRef.current?.focus(), 50)
    }
  }, [isSongDropdownOpen])

  const filteredSongsByCategory = useMemo(() => {
    const filtered = songs.filter((song) => {
      const matchesSearch =
        !songSearchTerm ||
        song.song.toLowerCase().includes(songSearchTerm.toLowerCase())
      const notPlaceholder = !(song as { song_placeholder?: boolean })
        .song_placeholder
      return matchesSearch && notPlaceholder
    })
    const gooseSongs = filtered.filter(
      (s) => s.category_type === "Goose" || s.category_type === "Goose Misc"
    )
    const tedTapesSongs = filtered.filter((s) => s.category_type === "Ted Tapes")
    const coverSongs = filtered.filter((s) => s.category_type === "Cover Songs")
    return [
      { category: "Goose", songs: gooseSongs },
      { category: "Ted Tapes", songs: tedTapesSongs },
      { category: "Cover Songs", songs: coverSongs },
    ].filter((g) => g.songs.length > 0)
  }, [songs, songSearchTerm])

  const handleSongClick = (songName: string) => {
    setSelectedSong(songName)
    setIsSongDropdownOpen(false)
    setSongSearchTerm("")
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1 relative" ref={dropdownRef}>
          <button
            type="button"
            className="w-full px-2 py-1.5 bg-muted border border-border rounded-md text-sm font-medium flex items-center justify-between hover:bg-muted/80"
            onClick={() => setIsSongDropdownOpen(!isSongDropdownOpen)}
          >
            <span
              className={
                selectedSong ? "text-foreground" : "text-muted-foreground"
              }
            >
              {selectedSong || "Select a song..."}
            </span>
            <ChevronDown
              className={`size-4 transition-transform ${
                isSongDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isSongDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg">
              <div className="p-2 border-b">
                <div className="relative">
                  <Input
                    ref={songSearchInputRef}
                    type="text"
                    value={songSearchTerm}
                    onChange={(e) => setSongSearchTerm(e.target.value)}
                    placeholder="Search songs..."
                    className="pr-8 h-7 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Search className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {filteredSongsByCategory.length > 0 ? (
                  filteredSongsByCategory.map((group) => (
                    <div key={group.category}>
                      <div className="px-3 py-1 bg-muted text-xs font-medium sticky top-0">
                        {group.category}
                      </div>
                      {group.songs.map((song) => (
                        <button
                          key={song.song_id}
                          type="button"
                          className={`w-full px-3 py-1 text-left text-[11px] hover:bg-muted/50 ${
                            selectedSong === song.song ? "bg-muted/30" : ""
                          }`}
                          onClick={() => handleSongClick(song.song)}
                        >
                          {song.song}
                        </button>
                      ))}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    {songSearchTerm
                      ? "No songs found matching your search"
                      : "No songs available"}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <Button
          size="sm"
          onClick={onAddSong}
          disabled={!selectedSong}
        >
          <Plus className="size-4" />
          <span className="hidden md:inline">Add Song</span>
          <span className="md:hidden">Add</span>
        </Button>
      </div>

      <div className="flex flex-wrap gap-1 justify-between">
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="xs"
            onClick={onAddSetBreak}
            disabled={!canAddSetBreak}
            className="bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50"
          >
            Add Set Break
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={onAddEncoreBreak}
            disabled={!canAddEncoreBreak}
            className="bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50"
          >
            Add Encore Break
          </Button>
        </div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="xs"
            onClick={onAddNewOriginalSong}
            className="bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50"
          >
            <Plus className="size-3" />
            New Original Song
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={onAddNewCoverSong}
            className="bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50"
          >
            <Plus className="size-3" />
            New Cover Song
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/20 text-destructive px-2 py-1 text-xs font-medium rounded-md">
          {error}
        </div>
      )}
    </div>
  )
}
