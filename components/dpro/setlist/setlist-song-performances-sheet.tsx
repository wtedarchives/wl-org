"use client"

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { SetlistSongPerformancesPanel } from "@/components/dpro/setlist/setlist-song-performances-panel"
import type { SetlistEntry } from "@/types/setlist"

interface SetlistSongPerformancesSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: SetlistEntry | null
  /** Human-readable tour name, e.g. "Fall 2024 Tour". */
  tourName: string | null
  /** When provided with tourName, used for tour-page song click (no entry needed). */
  songName?: string | null
  /** Display name for header (songs.song_displayname). */
  songDisplayName?: string | null
  /** Song ID for "View full song history" link when opened from tour page. */
  songId?: string | null
}

export function SetlistSongPerformancesSheet({
  open,
  onOpenChange,
  entry,
  tourName,
  songName: songNameProp,
  songDisplayName: songDisplayNameProp,
  songId: songIdProp,
}: SetlistSongPerformancesSheetProps) {
  const titleSong = songNameProp ?? entry?.entry_song ?? ""

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto flex max-h-[90vh] w-full max-w-4xl flex-col text-xs">
        <DrawerHeader className="sr-only">
          <DrawerTitle>
            {titleSong ?
              `${titleSong} – tour performances`
            : "Song performances"}
          </DrawerTitle>
        </DrawerHeader>
        <SetlistSongPerformancesPanel
          open={open}
          onDismiss={() => onOpenChange(false)}
          entry={entry}
          tourName={tourName}
          songName={songNameProp}
          songDisplayName={songDisplayNameProp}
          songId={songIdProp}
          closeControl={
            <DrawerClose asChild>
              <Button type="button" size="sm" variant="ghost">
                Close
              </Button>
            </DrawerClose>
          }
        />
      </DrawerContent>
    </Drawer>
  )
}
