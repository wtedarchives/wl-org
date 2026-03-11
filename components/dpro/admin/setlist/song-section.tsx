"use client"

import { useRef, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, Search } from "lucide-react"
import type { SongOptions, AdminSetlistEntryData } from "@/types/admin"
import { Input } from "@/components/ui/input"

interface SongSectionProps {
  songs: SongOptions[]
  songSearchTerm: string
  setSongSearchTerm: (term: string) => void
  isSongDropdownOpen: boolean
  setIsSongDropdownOpen: (open: boolean) => void
  selectedSongName: string
  editedEntry: AdminSetlistEntryData | null
  isEditing: boolean
  isNewEntry: boolean
  handleSongSelection: (songName: string) => void
}

export function SongSection({
  songs,
  songSearchTerm,
  setSongSearchTerm,
  isSongDropdownOpen,
  setIsSongDropdownOpen,
  selectedSongName,
  editedEntry,
  isEditing,
  isNewEntry,
  handleSongSelection,
}: SongSectionProps) {
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  })
  const triggerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const songSearchInputRef = useRef<HTMLInputElement>(null)
  const filteredSongs = !songSearchTerm
    ? songs
    : songs.filter((s) =>
        s.song.toLowerCase().includes(songSearchTerm.toLowerCase())
      )

  useEffect(() => {
    if (isSongDropdownOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      })
    }
  }, [isSongDropdownOpen])

  useEffect(() => {
    if (isSongDropdownOpen && songSearchInputRef.current) {
      setTimeout(() => songSearchInputRef.current?.focus(), 50)
    }
  }, [isSongDropdownOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        isSongDropdownOpen &&
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsSongDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isSongDropdownOpen, setIsSongDropdownOpen])

  const canEdit = isEditing || isNewEntry

  return (
    <div className="md:col-span-6">
      <label className="mb-0.5 block text-xs font-medium">Song</label>
      {canEdit ? (
        <div>
          <div
            ref={triggerRef}
            className="flex h-8 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-background px-2 text-xs"
            onClick={() => setIsSongDropdownOpen(!isSongDropdownOpen)}
          >
            <span className={selectedSongName ? "" : "text-muted-foreground"}>
              {selectedSongName || "Select a song..."}
            </span>
            <ChevronDown
              className={`size-4 transition-transform ${isSongDropdownOpen ? "rotate-180" : ""}`}
            />
          </div>
          {isSongDropdownOpen &&
            createPortal(
              <div
                ref={dropdownRef}
                className="fixed z-[100] max-h-[min(15rem,calc(100vh-8rem))] overflow-y-auto rounded-md border bg-background shadow-lg"
                style={{
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  width: dropdownPosition.width || "100%",
                }}
              >
                <div className="p-1">
                  <div className="relative">
                    <Input
                      ref={songSearchInputRef}
                      type="text"
                      value={songSearchTerm}
                      onChange={(e) => setSongSearchTerm(e.target.value)}
                      placeholder="Search songs..."
                      className="h-8 pr-8 text-xs"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Search className="absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredSongs.length > 0 ? (
                    filteredSongs.map((song) => (
                      <div
                        key={song.song_id}
                        className={`cursor-pointer px-2 py-1 text-xs hover:bg-muted ${
                          selectedSongName === song.song ? "bg-muted" : ""
                        }`}
                        onClick={() => handleSongSelection(song.song)}
                      >
                        {song.song}
                      </div>
                    ))
                  ) : (
                    <div className="px-2 py-1 text-center text-xs text-muted-foreground">
                      {songSearchTerm
                        ? "No songs found matching your search"
                        : "No songs available"}
                    </div>
                  )}
                </div>
              </div>,
              document.body
            )}
        </div>
      ) : (
        <Input
          value={editedEntry?.entry_song ?? ""}
          readOnly
          className="h-8 text-xs"
        />
      )}
    </div>
  )
}
