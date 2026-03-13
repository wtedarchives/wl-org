"use client"

import Link from "next/link"
import { X } from "lucide-react"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { formatEntryLength } from "@/lib/setlist-utils"
import type { SongWithGuest } from "@/hooks/use-guest-appearances"

function formatTourDate(dateStr: string): string {
  if (!dateStr) return ""
  const parts = dateStr.split("-")
  if (parts.length >= 3) {
    return `${parts[1]}.${parts[2]}.${parts[0].slice(2)}`
  }
  return dateStr
}

interface GuestAppearancesDrawerProps {
  modalData: {
    isOpen: boolean
    guestId: string
    guestName: string
    guestInstrument: string | null
    songs: SongWithGuest[]
    tourName: string
  }
  onOpenChange: (open: boolean) => void
  onClose: () => void
}

export function GuestAppearancesDrawer({
  modalData,
  onOpenChange,
  onClose,
}: GuestAppearancesDrawerProps) {
  return (
    <Drawer
      open={modalData.isOpen}
      onOpenChange={onOpenChange}
    >
      <DrawerContent className="mx-auto w-full max-w-4xl text-xs flex flex-col max-h-[90vh] data-[vaul-drawer-direction=bottom]:max-h-[90vh] data-[vaul-drawer-direction=bottom]:min-h-[70vh] after:!h-0">
        <DrawerHeader className="shrink-0 border-b border-border/60 pt-1 pb-3 px-4 flex flex-row items-center justify-between md:justify-center gap-3">
          <div className="w-8 shrink-0 md:hidden" aria-hidden />
          <div className="flex flex-1 min-w-0 justify-center">
            <div className="space-y-1.5 text-center">
              <DrawerTitle className="text-sm font-medium text-foreground m-0 mb-0.5">
                {modalData.guestName}
              </DrawerTitle>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {modalData.guestInstrument && (
                  <span className="inline-flex items-center rounded-full bg-wl-orange/20 px-2 py-0.5 text-[10px] font-medium text-wl-orange">
                    {modalData.guestInstrument}
                  </span>
                )}
                {modalData.tourName && (
                  <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {modalData.tourName}
                  </span>
                )}
              </div>
            </div>
          </div>
          <DrawerClose asChild>
            <button
              type="button"
              className="w-8 h-8 shrink-0 rounded-sm p-2 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring md:hidden flex items-center justify-center"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div className="flex-1 min-h-0 overflow-auto px-4 pb-4 pt-2">
          <Table className="min-w-full border-separate border-spacing-y-0.25 text-[11px]">
            <TableHeader>
              <TableRow className="border-b border-border/60 hover:bg-transparent">
                <TableHead className="whitespace-nowrap text-left text-[11px] font-medium py-2 pr-4">
                  Song
                </TableHead>
                <TableHead className="whitespace-nowrap text-center text-[11px] font-medium py-2 px-2">
                  Show
                </TableHead>
                <TableHead className="whitespace-nowrap text-left text-[11px] font-medium py-2 px-2">
                  Location
                </TableHead>
                <TableHead className="w-[4.5rem] shrink-0 text-left text-[11px] font-medium py-2 px-2">
                  &nbsp;
                </TableHead>
                <TableHead className="whitespace-nowrap text-center text-[11px] font-medium py-2 pl-2 tabular-nums">
                  Length
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modalData.songs.map((song) => (
                <TableRow
                  key={`${song.show_id}-${song.entry_song}`}
                  className="align-middle"
                >
                  <TableCell className="align-middle py-1.5 pr-4 text-[11px] font-medium">
                    <SongDisplayName
                      song={song.entry_song}
                      songDisplayName={song.song_displayname}
                    />
                  </TableCell>
                  <TableCell className="align-middle py-1.5 px-2 text-center text-[11px] whitespace-nowrap">
                    <Link
                      href={`/archive/setlist/${song.show_id}`}
                      onClick={onClose}
                      className="font-medium hover:underline"
                    >
                      {formatTourDate(song.show_date)}
                    </Link>
                  </TableCell>
                  <TableCell className="align-middle py-1.5 px-2 text-[11px] text-muted-foreground whitespace-nowrap">
                    {song.show_venue_location}
                  </TableCell>
                  <TableCell className="align-middle py-1.5 px-2 text-left text-[11px] w-[4.5rem] shrink-0">
                    <span className="inline-flex items-center gap-2">
                      {song.entry_short && (
                        <span className="text-red-400 font-medium">
                          [{song.entry_short}]
                        </span>
                      )}
                      {song.entry_segue && (
                        <span className="text-red-400">→</span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="align-middle py-1.5 pl-2 text-center text-[11px] text-muted-foreground whitespace-nowrap tabular-nums">
                    {formatEntryLength(song.entry_length) || ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DrawerFooter className="border-t border-border/60 shrink-0 pt-3 pb-4">
          <div className="flex flex-col items-stretch justify-end gap-2 sm:flex-row sm:items-center sm:justify-center">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/archive/personnel/${modalData.guestId}`} onClick={onClose}>
                Guest Profile
              </Link>
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
