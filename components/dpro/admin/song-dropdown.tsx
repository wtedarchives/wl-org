"use client"

import { useRef, useEffect } from "react"
import { ChevronDown, Search } from "lucide-react"
import type { SongDataFull } from "@/types/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SongDropdownProps {
  songs: SongDataFull[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  onSongSelect: (song: SongDataFull) => void
  selectedSong?: SongDataFull | null
}

export function SongDropdown({
  songs,
  searchTerm,
  setSearchTerm,
  isOpen,
  setIsOpen,
  onSongSelect,
  selectedSong,
}: SongDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const selectedSongRef = useRef<HTMLButtonElement | null>(null)

  const filteredSongs = songs.filter((s) =>
    s.song.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [setIsOpen])

  useEffect(() => {
    if (
      isOpen &&
      selectedSong &&
      selectedSongRef.current &&
      scrollContainerRef.current
    ) {
      setTimeout(() => {
        selectedSongRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        })
      }, 100)
    }
  }, [isOpen, selectedSong])

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        Song
        <ChevronDown className="size-4" />
      </Button>
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-64 max-h-96 overflow-y-auto rounded-md border bg-background shadow-lg">
          <div className="p-1">
            <div className="relative">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search songs..."
                className="h-8 pr-8 text-xs"
              />
              <Search className="absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
          <div
            ref={scrollContainerRef}
            className="max-h-64 overflow-y-auto divide-y"
          >
            {filteredSongs.map((song) => (
              <button
                key={song.song_id}
                ref={
                  selectedSong?.song_id === song.song_id ? selectedSongRef : null
                }
                onClick={() => onSongSelect(song)}
                className={`w-full px-2 py-1 text-left text-xs transition-colors hover:bg-muted ${
                  selectedSong?.song_id === song.song_id ? "bg-muted" : ""
                }`}
              >
                {song.song}
              </button>
            ))}
            {filteredSongs.length === 0 && (
              <div className="px-2 py-1 text-center text-xs text-muted-foreground">
                No songs found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
