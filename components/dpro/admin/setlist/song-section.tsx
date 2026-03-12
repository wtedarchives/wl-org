"use client"

import type { SongOptions, AdminSetlistEntryData } from "@/types/admin"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"

interface SongSectionProps {
  songs: SongOptions[]
  selectedSongName: string
  editedEntry: AdminSetlistEntryData | null
  isEditing: boolean
  isNewEntry: boolean
  handleSongSelection: (songName: string) => void
  /** Portal container - pass when inside a Dialog to fix click/scroll issues */
  comboboxContainer?: React.RefObject<HTMLDivElement | null>
}

export function SongSection({
  songs,
  selectedSongName,
  editedEntry,
  isEditing,
  isNewEntry,
  handleSongSelection,
  comboboxContainer,
}: SongSectionProps) {
  const canEdit = isEditing || isNewEntry
  const songNames = songs.map((s) => s.song)

  return (
    <div className="md:col-span-6">
      <label className="mb-0.5 block text-xs font-medium">Song</label>
      {canEdit ? (
        <Combobox
          items={songNames}
          value={selectedSongName || null}
          onValueChange={(value) => value != null && handleSongSelection(value)}
          disabled={!canEdit}
        >
          <ComboboxInput
            placeholder="Select a song..."
            className="h-6 w-full text-xs"
          />
          <ComboboxContent container={comboboxContainer ?? undefined}>
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
      ) : (
        <Input
          value={editedEntry?.entry_song ?? ""}
          readOnly
          className="h-6 text-xs"
        />
      )}
    </div>
  )
}
