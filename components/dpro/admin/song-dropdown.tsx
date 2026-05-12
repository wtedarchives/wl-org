"use client"

import { useState } from "react"
import type { SongDataFull } from "@/types/admin"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

interface SongDropdownProps {
  songs: SongDataFull[]
  onSongSelect: (song: SongDataFull) => void
  selectedSong?: SongDataFull | null
}

export function SongDropdown({
  songs,
  onSongSelect,
  selectedSong,
}: SongDropdownProps) {
  const songNames = songs.map((s) => s.song)
  const [open, setOpen] = useState(false)
  const [filterQuery, setFilterQuery] = useState("")

  const showFixedLabel = !!selectedSong && !open
  const inputValue = showFixedLabel ? "Song" : filterQuery

  return (
    <Combobox
      items={songNames}
      value={selectedSong?.song ?? null}
      onValueChange={(value) => {
        if (value != null) {
          const song = songs.find((s) => s.song === value)
          if (song) onSongSelect(song)
        }
      }}
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setFilterQuery("")
      }}
      inputValue={inputValue}
      onInputValueChange={(v) => !showFixedLabel && setFilterQuery(v ?? "")}
    >
      <ComboboxInput
        placeholder="Song"
        className="h-6 w-64 text-xs"
        showClear={false}
      />
      <ComboboxContent className="wl-home-v2-archive-admin-combobox-popup">
        <ComboboxEmpty>No songs found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => {
            const song = songs.find((s) => s.song === item)
            return (
              <ComboboxItem
                key={song?.song_id ?? item}
                value={item}
                className="text-xs"
              >
                {item}
              </ComboboxItem>
            )
          }}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
