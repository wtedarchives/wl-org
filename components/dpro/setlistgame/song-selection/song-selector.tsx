"use client"

import { useMemo } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from "@/components/ui/combobox"
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

const CATEGORY_ORDER = ["Goose", "Ted Tapes", "Cover Songs"] as const

function getCategoryLabel(categoryType: string | undefined): string {
  if (!categoryType) return "Other"
  if (categoryType === "Goose" || categoryType === "Goose Misc") return "Goose"
  if (categoryType === "Ted Tapes") return "Ted Tapes"
  if (categoryType === "Cover Songs") return "Cover Songs"
  return categoryType
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
  const groups = useMemo(() => {
    const filtered = songs.filter((song) => {
      const isPlaceholder = (song as { song_placeholder?: boolean }).song_placeholder
      return !isPlaceholder
    })
    const result: { value: string; items: string[] }[] = []
    for (const cat of CATEGORY_ORDER) {
      const catSongs = filtered
        .filter((s) => getCategoryLabel(s.category_type) === cat)
        .map((s) => s.song)
      if (catSongs.length > 0) {
        result.push({ value: cat, items: catSongs })
      }
    }
    return result
  }, [songs])

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1 min-w-0">
          <Combobox
            items={groups}
            value={selectedSong || null}
            onValueChange={(v) => setSelectedSong(v ?? "")}
            filter={(itemValue, query) => {
              if (!query?.trim()) return true
              return String(itemValue)
                .toLowerCase()
                .includes(query.toLowerCase().trim())
            }}
          >
            <ComboboxInput
              placeholder="Search songs..."
              className="w-full"
              showClear={!!selectedSong}
            />
            <ComboboxContent>
              <ComboboxEmpty>No songs found matching your search</ComboboxEmpty>
              <ComboboxList className="max-h-64 overflow-y-auto overscroll-contain">
                {groups.map((group) => (
                  <ComboboxGroup key={group.value} items={group.items}>
                    <ComboboxLabel>{group.value}</ComboboxLabel>
                    <ComboboxCollection>
                      {(item: string) => (
                        <ComboboxItem key={item} value={item}>
                          {item}
                        </ComboboxItem>
                      )}
                    </ComboboxCollection>
                  </ComboboxGroup>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
        <Button
          size="sm"
          onClick={onAddSong}
          disabled={!selectedSong}
          className="shrink-0"
        >
          <Plus className="size-4" />
          <span className="hidden md:inline ml-1">Add Song</span>
          <span className="md:hidden ml-1">Add</span>
        </Button>
      </div>

      <div className="flex flex-wrap gap-1 justify-between">
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="xs"
            onClick={onAddSetBreak}
            disabled={!canAddSetBreak}
            className="text-xs bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50"
          >
            Add Set Break
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={onAddEncoreBreak}
            disabled={!canAddEncoreBreak}
            className="text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50"
          >
            Add Encore Break
          </Button>
        </div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="xs"
            onClick={onAddNewOriginalSong}
            className="text-xs bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50"
          >
            <Plus className="size-3" />
            New Original Song
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={onAddNewCoverSong}
            className="text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50"
          >
            <Plus className="size-3" />
            New Cover Song
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/20 px-3 py-2 text-sm text-destructive font-medium">
          {error}
        </div>
      )}
    </div>
  )
}
