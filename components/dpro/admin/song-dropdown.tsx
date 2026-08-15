"use client"

import { useState, useRef, useEffect, type CSSProperties } from "react"
import { createPortal } from "react-dom"
import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react"
import { scrollChildIntoContainer } from "@/lib/scroll-child-into-container"
import type { SongDataFull } from "@/types/admin"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface SongDropdownProps {
  songs: SongDataFull[]
  onSongSelect: (song: SongDataFull) => void
  selectedSong?: SongDataFull | null
  /** Merged onto the trigger (default: tours header pill). */
  triggerClassName?: string
}

export function SongDropdown({
  songs,
  onSongSelect,
  selectedSong,
  triggerClassName,
}: SongDropdownProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const selectedSongRef = useRef<HTMLButtonElement | null>(null)

  const filteredSongs = songs.filter((song) => {
    const q = searchTerm.toLowerCase().trim()
    if (!q) return true
    return (
      song.song.toLowerCase().includes(q) ||
      (song.song_displayname ?? "").toLowerCase().includes(q)
    )
  })

  useEffect(() => {
    if (isDropdownOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      })
    }
  }, [isDropdownOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        isDropdownOpen &&
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isDropdownOpen])

  useEffect(() => {
    if (
      isDropdownOpen &&
      selectedSong &&
      selectedSongRef.current &&
      scrollContainerRef.current
    ) {
      const container = scrollContainerRef.current
        const child = selectedSongRef.current
        if (container && child) scrollChildIntoContainer(container, child)
    }
  }, [isDropdownOpen, selectedSong])

  const handleSongSelect = (song: SongDataFull) => {
    onSongSelect(song)
    setIsDropdownOpen(false)
    setSearchTerm("")
  }

  const dropdownContent = isDropdownOpen && (
    <div
      ref={dropdownRef}
      className={
        "wl-home-v2-archive-admin-floating-dropdown " +
        "wl-home-v2-archive-admin-floating-dropdown--wide fixed " +
        "wl-home-v2-archive-admin-floating-dropdown--anchor-tr"
      }
      style={
        {
          ["--adm-dd-top" as string]: `${dropdownPosition.top}px`,
          ["--adm-dd-right" as string]: `${dropdownPosition.right}px`,
        } as CSSProperties
      }
    >
      <div className="wl-home-v2-archive-admin-floating-dropdown__search">
        <div className="relative">
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search songs..."
            className="h-8 pr-8 text-xs"
          />
          <MagnifyingGlass className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-white/40" />
        </div>
      </div>
      <div
        ref={scrollContainerRef}
        className="wl-home-v2-archive-admin-floating-dropdown__scroll divide-y divide-[rgb(49,51,49)]"
      >
        {filteredSongs.map((song) => (
          <button
            key={song.song_id}
            type="button"
            ref={
              selectedSong?.song_id === song.song_id ? selectedSongRef : null
            }
            onClick={() => handleSongSelect(song)}
            className={
              "wl-home-v2-archive-admin-floating-dropdown__row " +
              "wl-home-v2-archive-admin-floating-dropdown__row--compact" +
              (selectedSong?.song_id === song.song_id
                ? " wl-home-v2-archive-admin-floating-dropdown__row--selected"
                : "")
            }
          >
            <span
              className={
                "wl-home-v2-archive-admin-floating-dropdown__row-line " +
                "wl-home-v2-archive-admin-song-dropdown__primary"
              }
            >
              {song.song}
            </span>
          </button>
        ))}
        {filteredSongs.length === 0 && (
          <div className="wl-home-v2-archive-admin-floating-dropdown-empty">
            No songs found
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={cn("wl-home-v2-tours-header-pill gap-1", triggerClassName)}
      >
        Select song
        <CaretDown className="size-3.5 shrink-0 opacity-80" aria-hidden />
      </Button>
      {dropdownContent && createPortal(dropdownContent, document.body)}
    </>
  )
}
