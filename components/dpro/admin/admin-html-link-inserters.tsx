"use client"

import { useMemo, useState } from "react"
import { ChevronDown, Search } from "lucide-react"
import { formatDate, getShowDisplayData } from "@/lib/utils/show-utils"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import type { ShowData } from "@/types/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type AdminHtmlLinkSong = { song: string; song_id: string }

export function insertTextAtTextareaCursor(
  textarea: HTMLTextAreaElement | null,
  text: string,
  currentValue: string,
  onValueChange: (newValue: string) => void,
  cursorOffset: number = text.length,
) {
  if (!textarea) {
    onValueChange(currentValue + text)
    return
  }

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const newValue = currentValue.slice(0, start) + text + currentValue.slice(end)
  onValueChange(newValue)

  setTimeout(() => {
    textarea.focus()
    const newPosition = start + cursorOffset
    textarea.setSelectionRange(newPosition, newPosition)
  }, 0)
}

interface AdminHtmlLinkInsertersProps {
  allShows?: ShowData[]
  songs: AdminHtmlLinkSong[]
  onInsert: (text: string, cursorOffset?: number) => void
  showInsertShow?: boolean
  showInsertSong?: boolean
  showInsertArrow?: boolean
  showInsertLineBreak?: boolean
  disabled?: boolean
}

/** Searchable Insert Show / Insert Song controls for admin HTML fields (callbacks, coach notes, changes). */
export function AdminHtmlLinkInserters({
  allShows = [],
  songs,
  onInsert,
  showInsertShow = true,
  showInsertSong = true,
  showInsertArrow = false,
  showInsertLineBreak = false,
  disabled = false,
}: AdminHtmlLinkInsertersProps) {
  const [songSearchTerm, setSongSearchTerm] = useState("")
  const [showSearchTerm, setShowSearchTerm] = useState("")
  const [songPopoverOpen, setSongPopoverOpen] = useState(false)
  const [showPopoverOpen, setShowPopoverOpen] = useState(false)

  const filteredSongs = useMemo(() => {
    const q = songSearchTerm.toLowerCase()
    return songs.filter((song) => song.song.toLowerCase().includes(q))
  }, [songs, songSearchTerm])

  const filteredShows = useMemo(() => {
    const searchLower = showSearchTerm.toLowerCase()
    return allShows.filter((show) => {
      const dateStr = formatDate(show.show_date)
      return (
        dateStr.includes(searchLower) ||
        show.show_canonid?.toString().includes(searchLower) ||
        show.show_group?.toLowerCase().includes(searchLower) ||
        show.show_venue_location?.toLowerCase().includes(searchLower) ||
        show.show_subvenue?.toLowerCase().includes(searchLower)
      )
    })
  }, [allShows, showSearchTerm])

  const insertSongLink = (song: AdminHtmlLinkSong) => {
    onInsert(`<a href="${getSongArchiveUrl(song.song_id)}">${song.song}</a>`)
    setSongPopoverOpen(false)
    setSongSearchTerm("")
  }

  const insertShowLink = (show: ShowData) => {
    const dateStr = formatDate(show.show_date)
    onInsert(`<a href="${getSetlistArchiveUrl(show.show_id)}">${dateStr}</a>`)
    setShowPopoverOpen(false)
    setShowSearchTerm("")
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showInsertArrow ?
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 text-xs"
          disabled={disabled}
          onClick={() => onInsert("→")}
          title="Insert arrow"
        >
          →
        </Button>
      : null}

      {showInsertLineBreak ?
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 text-xs"
          disabled={disabled}
          onClick={() => onInsert("<br />\n", "<br />\n".length)}
          title="Insert <br /> tag"
        >
          BR
        </Button>
      : null}

      {showInsertShow ?
        <Popover open={showPopoverOpen} onOpenChange={setShowPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 gap-1 text-xs"
              disabled={disabled}
            >
              Insert Show
              <ChevronDown className="size-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end" sideOffset={4}>
            <div className="p-2">
              <div className="relative">
                <Search className="absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={showSearchTerm}
                  onChange={(e) => setShowSearchTerm(e.target.value)}
                  placeholder="Search shows..."
                  className="h-8 pr-8 text-xs"
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto border-t">
              {filteredShows.map((show) => {
                const { dateStr, canonIdStr, locationStr } =
                  getShowDisplayData(show)
                return (
                  <button
                    key={show.show_id}
                    type="button"
                    onClick={() => insertShowLink(show)}
                    className="w-full px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted"
                  >
                    <span className="font-medium">{dateStr}</span>
                    {canonIdStr}
                    {locationStr}
                  </button>
                )
              })}
              {filteredShows.length === 0 ?
                <div className="px-4 py-2 text-xs italic text-muted-foreground">
                  No shows found
                </div>
              : null}
            </div>
          </PopoverContent>
        </Popover>
      : null}

      {showInsertSong ?
        <Popover open={songPopoverOpen} onOpenChange={setSongPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 gap-1 text-xs"
              disabled={disabled}
            >
              Insert Song
              <ChevronDown className="size-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="end" sideOffset={4}>
            <div className="p-2">
              <div className="relative">
                <Search className="absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={songSearchTerm}
                  onChange={(e) => setSongSearchTerm(e.target.value)}
                  placeholder="Search songs..."
                  className="h-8 pr-8 text-xs"
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto border-t">
              {filteredSongs.map((song) => (
                <button
                  key={song.song_id}
                  type="button"
                  onClick={() => insertSongLink(song)}
                  className="w-full px-2 py-1.5 text-left text-xs font-medium transition-colors hover:bg-muted"
                >
                  {song.song}
                </button>
              ))}
              {filteredSongs.length === 0 ?
                <div className="px-4 py-2 text-xs italic text-muted-foreground">
                  No songs found
                </div>
              : null}
            </div>
          </PopoverContent>
        </Popover>
      : null}
    </div>
  )
}
