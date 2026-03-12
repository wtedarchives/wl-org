"use client"

import { useRef, useState, useMemo } from "react"
import { ChevronDown, Search } from "lucide-react"
import type { AdminShowData } from "@/types/admin"
import { formatDate, getShowDisplayData } from "@/lib/utils/show-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface SongData {
  song: string
  song_id: string
}

interface CallbacksEditorProps {
  selectedShow: AdminShowData
  editedShow: AdminShowData | null
  isEditing: boolean
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  allShows: AdminShowData[]
  songs: SongData[]
}

export function CallbacksEditor({
  selectedShow,
  editedShow,
  isEditing,
  onInputChange,
  allShows,
  songs,
}: CallbacksEditorProps) {
  const callbacksTextareaRef = useRef<HTMLTextAreaElement>(null)
  const [songSearchTerm, setSongSearchTerm] = useState("")
  const [showSearchTerm, setShowSearchTerm] = useState("")
  const [songPopoverOpen, setSongPopoverOpen] = useState(false)
  const [showPopoverOpen, setShowPopoverOpen] = useState(false)

  const filteredSongs = useMemo(() => {
    return songs.filter((song) =>
      song.song.toLowerCase().includes(songSearchTerm.toLowerCase())
    )
  }, [songs, songSearchTerm])

  const filteredShows = useMemo(() => {
    return allShows.filter((show) => {
      const searchLower = showSearchTerm.toLowerCase()
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

  const insertAtCursor = (
    text: string,
    cursorOffset: number = text.length
  ) => {
    if (!callbacksTextareaRef.current || !editedShow) return

    const textarea = callbacksTextareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentValue = editedShow.show_callbacks ?? ""

    const newValue =
      currentValue.slice(0, start) + text + currentValue.slice(end)

    onInputChange({
      target: { name: "show_callbacks", value: newValue },
    } as React.ChangeEvent<HTMLTextAreaElement>)

    setTimeout(() => {
      if (callbacksTextareaRef.current) {
        callbacksTextareaRef.current.focus()
        const newPosition = start + cursorOffset
        callbacksTextareaRef.current.setSelectionRange(newPosition, newPosition)
      }
    }, 0)
  }

  const insertArrow = () => {
    insertAtCursor("→")
  }

  const insertLineBreak = () => {
    insertAtCursor("<br />\n", "<br />\n".length)
  }

  const insertSongLink = (song: SongData) => {
    const linkText = `<a href="/dpro/song/${song.song_id}">${song.song}</a>`
    insertAtCursor(linkText)
    setSongPopoverOpen(false)
    setSongSearchTerm("")
  }

  const insertShowLink = (show: AdminShowData) => {
    const dateStr = formatDate(show.show_date)
    const linkText = `<a href="/dpro/setlist/${show.show_id}">${dateStr}</a>`
    insertAtCursor(linkText)
    setShowPopoverOpen(false)
    setShowSearchTerm("")
  }

  if (!selectedShow?.show_callbacks && !isEditing) return null

  return (
    <div className="space-y-1 md:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-xs font-medium">Callbacks</label>

        {isEditing && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 text-xs"
              onClick={insertArrow}
              title="Insert arrow"
            >
              →
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 text-xs"
              onClick={insertLineBreak}
              title="Insert <br /> tag"
            >
              BR
            </Button>

            <Popover open={showPopoverOpen} onOpenChange={setShowPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 gap-1 text-xs"
                >
                  Insert Show
                  <ChevronDown className="size-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 p-0"
                align="end"
                sideOffset={4}
              >
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
                        className="w-full px-2 py-1.5 text-left text-xs hover:bg-muted transition-colors"
                      >
                        <span className="font-medium">{dateStr}</span>
                        {canonIdStr}
                        {locationStr}
                      </button>
                    )
                  })}
                  {filteredShows.length === 0 && (
                    <div className="px-4 py-2 text-xs text-muted-foreground italic">
                      No shows found
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <Popover open={songPopoverOpen} onOpenChange={setSongPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 gap-1 text-xs"
                >
                  Insert Song
                  <ChevronDown className="size-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-64 p-0"
                align="end"
                sideOffset={4}
              >
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
                      className="w-full px-2 py-1.5 text-left text-xs font-medium hover:bg-muted transition-colors"
                    >
                      {song.song}
                    </button>
                  ))}
                  {filteredSongs.length === 0 && (
                    <div className="px-4 py-2 text-xs text-muted-foreground italic">
                      No songs found
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {isEditing ? (
        <textarea
          ref={callbacksTextareaRef}
          name="show_callbacks"
          value={editedShow?.show_callbacks ?? ""}
          onChange={onInputChange}
          rows={4}
          className="w-full rounded-md border border-input bg-background px-2 py-1 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          placeholder="Enter callbacks HTML..."
        />
      ) : (
        <div
          className="min-h-[100px] w-full rounded-md border border-input bg-muted/30 px-2 py-1.5 text-xs [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2"
          dangerouslySetInnerHTML={{
            __html: selectedShow.show_callbacks ?? "",
          }}
        />
      )}
    </div>
  )
}
