"use client"

import { useMemo } from "react"
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
import type { Song } from "./types"
import { SongDisplayName } from "@/components/dpro/song-display-name"

const CATEGORY_ORDER = ["Goose", "Ted Tapes", "Cover Songs"] as const

function getCategoryLabel(categoryType: string | undefined): string {
  if (!categoryType) return "Other"
  if (categoryType === "Goose" || categoryType === "Goose Misc") return "Goose"
  if (categoryType === "Ted Tapes") return "Ted Tapes"
  if (categoryType === "Cover Songs") return "Cover Songs"
  return categoryType
}

interface SongSearchCardProps {
  songs: Song[]
  songDisplayNameMap: Record<string, string | null>
  selectedSong: string
  setSelectedSong: (song: string) => void
  onAddSong: () => void
  error: string | null
}

export function SongSearchCard({
  songs,
  songDisplayNameMap,
  selectedSong,
  setSelectedSong,
  onAddSong,
  error,
}: SongSearchCardProps) {
  const filteredSongsByCategory = useMemo(() => {
    const filtered = songs.filter((song) => {
      const isPlaceholder = (song as { song_placeholder?: boolean }).song_placeholder
      return !isPlaceholder
    })
    const groups: { category: string; songs: Song[] }[] = []
    for (const cat of CATEGORY_ORDER) {
      const catSongs = filtered.filter((s) => getCategoryLabel(s.category_type) === cat)
      if (catSongs.length > 0) {
        groups.push({ category: cat, songs: catSongs })
      }
    }
    return groups
  }, [songs])

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
              <span className="block min-w-0 max-w-full truncate">
                {selectedSong ? (
                  <SongDisplayName
                    song={selectedSong}
                    songDisplayName={songDisplayNameMap[selectedSong] ?? null}
                  />
                ) : null}
              </span>
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        <Command
          className="h-auto rounded-lg border border-border overflow-hidden"
          shouldFilter={true}
        >
          <CommandInput placeholder="Type to search..." className="text-xs py-2 h-full" />
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
                    className="text-xs py-0.5 cursor-pointer"
                  >
                    <SongDisplayName
                      song={song.song}
                      songDisplayName={song.song_displayname}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
        <Button
          size="sm"
          onClick={onAddSong}
          disabled={!selectedSong}
          className="w-full"
        >
          <Plus className="size-4" />
          Add Song
        </Button>
        {error && (
          <p className="text-xs text-destructive font-medium">{error}</p>
        )}
      </CardContent>
    </Card>
  )
}
