"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import type { ReactNode } from "react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { getSongArchiveUrl } from "@/lib/song-archive-url"

interface SongBasic {
  song: string
  song_id: string
  song_displayname?: string | null
}

const BATCH_SIZE = 1000

export function SongSearch({
  className = "",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  triggerVariant = "default",
  triggerClassName,
}: {
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** `icon` — square icon button (song detail verbatim UI). */
  triggerVariant?: "default" | "icon"
  triggerClassName?: string
}) {
  const router = useRouter()
  const listRef = useRef<HTMLDivElement>(null)
  const [songs, setSongs] = useState<SongBasic[]>([])
  const [internalOpen, setInternalOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [selectedSong, setSelectedSong] = useState("")

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = useCallback(
    (next: boolean) => {
      if (isControlled) {
        controlledOnOpenChange?.(next)
      } else {
        setInternalOpen(next)
      }
    },
    [controlledOnOpenChange, isControlled]
  )

  useEffect(() => {
    if (open) setSearchValue("")
  }, [open])

  useEffect(() => {
    async function fetchAllSongs() {
      if (!supabase) return
      try {
        const { count, error: countError } = await supabase
          .from("songs")
          .select("*", { count: "exact", head: true })
          .eq("song_placeholder", false)

        if (countError) throw countError

        const totalBatches = Math.ceil((count ?? 0) / BATCH_SIZE)
        let allData: SongBasic[] = []

        for (let i = 0; i < totalBatches; i++) {
          const start = i * BATCH_SIZE
          const end = Math.min(start + BATCH_SIZE - 1, (count ?? 0) - 1)

          const { data, error } = await supabase
            .from("songs")
            .select("song, song_id, song_displayname")
            .eq("song_placeholder", false)
            .order("song", { ascending: true })
            .range(start, end)

          if (error) throw error
          if (data) allData = [...allData, ...data]
        }

        setSongs(allData)
      } catch {
        setSongs([])
      }
    }
    fetchAllSongs()
  }, [])

  const handleSelect = (songId: string, songName: string) => {
    setSelectedSong(songName)
    setOpen(false)
    router.push(getSongArchiveUrl(songId))
  }

  const trigger: ReactNode =
    triggerVariant === "icon" ?
      <button
        type="button"
        className={triggerClassName}
        title="Search songs"
        aria-label="Search songs"
        onClick={() => setOpen(true)}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
    : <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-auto justify-between gap-2 pr-2 font-semibold text-xs transition-colors hover:!bg-card/50"
        onClick={() => setOpen(true)}
      >
        <span className="truncate min-w-0 text-left">
          {selectedSong || "Search"}
        </span>
        <Search className="size-3 shrink-0" />
      </Button>

  return (
    <div className={className}>
      {trigger}
      <CommandDialog open={open} onOpenChange={setOpen} label="Search songs">
        <CommandInput
          placeholder="Search songs..."
          value={searchValue}
          onValueChange={(value) => {
            setSearchValue(value)
            listRef.current?.scrollTo({ top: 0 })
          }}
        />
        <CommandList ref={listRef}>
          <CommandEmpty>No songs found.</CommandEmpty>
          <CommandGroup heading="Songs">
            {songs.map((song) => (
              <CommandItem
                key={song.song_id}
                value={song.song_id}
                keywords={[
                  song.song,
                  ...(song.song_displayname?.trim()
                    ? [song.song_displayname.trim()]
                    : []),
                ]}
                onSelect={() => handleSelect(song.song_id, song.song)}
              >
                <span className="text-xs">{song.song}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  )
}
