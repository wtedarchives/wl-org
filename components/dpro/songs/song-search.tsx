"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
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

interface SongBasic {
  song: string
  song_id: string
}

const BATCH_SIZE = 1000

export function SongSearch({ className = "" }: { className?: string }) {
  const router = useRouter()
  const listRef = useRef<HTMLDivElement>(null)
  const [songs, setSongs] = useState<SongBasic[]>([])
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [selectedSong, setSelectedSong] = useState("")

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
            .select("song, song_id")
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
    router.push(`/archive/song/${songId}`)
  }

  return (
    <div className={className}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full justify-between gap-2 pr-2 font-semibold text-xs md:w-auto"
        onClick={() => setOpen(true)}
      >
        <span className="truncate">{selectedSong || "Search"}</span>
        <Search className="size-3 shrink-0" />
      </Button>
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
                keywords={[song.song]}
                onSelect={() => handleSelect(song.song_id, song.song)}
              >
                {song.song}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  )
}
