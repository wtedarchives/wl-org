"use client"

import Link from "next/link"
import { Loader2 } from "lucide-react"

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
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
import { formatSetlistDate, formatEntryLength } from "@/lib/setlist-utils"
import { getPlacementIndexCellBg } from "@/components/dpro/setlist/display-setlist-table.constants"
import { useSongUserPerformances } from "@/hooks/use-song-user-performances"

interface UserSongPerformancesSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  songName: string | null
  songDisplayName?: string | null
  songId?: string | null
  userId: string | null
  attendedShowIds: string[]
  isOwnProfile: boolean
}

export function UserSongPerformancesSheet({
  open,
  onOpenChange,
  songName,
  songDisplayName,
  songId,
  userId,
  attendedShowIds,
  isOwnProfile,
}: UserSongPerformancesSheetProps) {
  const { performances, loading, error } = useSongUserPerformances(
    open,
    songName,
    userId,
    attendedShowIds
  )

  const badgeLabel = isOwnProfile ? "Your shows" : "Attended shows"

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto w-full max-w-4xl text-xs">
        <DrawerHeader className="border-b border-border/60 pt-1 pb-3">
          <DrawerTitle className="sr-only">
            {songName ? `${songName} – performances` : "Song performances"}
          </DrawerTitle>
          {songName ? (
            <div className="space-y-1 text-[11px]">
              <p className="text-sm font-medium text-foreground">
                {songDisplayName || songName}
              </p>
              <p className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {badgeLabel}
              </p>
            </div>
          ) : (
            <DrawerDescription>No song selected.</DrawerDescription>
          )}
        </DrawerHeader>

        <div className="flex max-h-[52vh] min-h-[140px] flex-col overflow-y-auto px-3 pb-3 pt-2">
          {!songName ? (
            <p className="text-[11px] text-muted-foreground">
              Select a song to view its performances at your attended shows.
            </p>
          ) : loading ? (
            <div className="flex flex-1 min-h-[140px] items-center justify-center">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                <span>Loading performances…</span>
              </div>
            </div>
          ) : error ? (
            <p className="text-[11px] text-destructive">{error}</p>
          ) : performances.length === 0 ? (
            <p className="py-2 text-[11px] text-muted-foreground">
              No performances of this song were found at your attended shows.
            </p>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="min-w-full border-separate border-spacing-y-0.25 text-[11px]">
                <TableHeader>
                  <TableRow className="border-b border-border/60">
                    <TableHead className="whitespace-nowrap text-center text-[11px]">
                      Date
                    </TableHead>
                    <TableHead className="w-1 shrink-0 p-0" aria-hidden />
                    <TableHead className="whitespace-nowrap text-[11px]">
                      Venue
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-left text-[11px]">
                      &nbsp;
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center text-[11px]">
                      Length
                    </TableHead>
                    <TableHead className="min-w-[400px] max-w-[400px] whitespace-normal text-[11px]">
                      Coach&apos;s Notes
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performances.map((perf) => (
                    <TableRow
                      key={`${perf.show_id}-${perf.entry_id}`}
                      className="align-middle"
                    >
                      <TableCell className="whitespace-nowrap align-middle px-2 py-1 text-center text-[11px]">
                        <Link
                          href={`/archive/setlist/${perf.show_id}`}
                          className="hover:underline"
                        >
                          {formatSetlistDate(perf.show_date)}
                        </Link>
                      </TableCell>
                      <TableCell
                        className="relative w-2 shrink-0 p-0 align-middle"
                        aria-hidden
                      >
                        {perf.entry_placement ? (
                          <div
                            className="absolute inset-y-1 w-1 left-0 right-0 rounded-sm"
                            style={{
                              backgroundColor: getPlacementIndexCellBg(
                                perf.entry_placement
                              ),
                            }}
                            aria-hidden
                          />
                        ) : null}
                      </TableCell>
                      <TableCell className="align-middle px-2 py-1 text-[11px]">
                        {perf.venue_id ? (
                          <Link
                            href={`/archive/venue/${perf.venue_id}`}
                            className="hover:underline"
                          >
                            {perf.show_venue_location ||
                              perf.show_subvenue ||
                              "—"}
                          </Link>
                        ) : (
                          <span>
                            {perf.show_venue_location || perf.show_subvenue || "—"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="align-middle px-2 py-1 text-left text-[11px]">
                        <div className="inline-flex items-center gap-1">
                          {perf.entry_short && (
                            <span className="text-[0.625rem] text-red-400">
                              [{perf.entry_short}]
                            </span>
                          )}
                          {perf.entry_segue && (
                            <span className="text-[0.625rem] text-red-400">
                              →
                              {perf.entry_segue.replace(/^>\s*/, "").trim()}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap align-middle px-2 py-1 text-center text-[11px]">
                        {formatEntryLength(perf.entry_length) || ""}
                      </TableCell>
                      <TableCell className="min-w-[400px] max-w-[400px] align-middle whitespace-normal px-2 py-1 text-[11px]">
                        {perf.entry_coachnotes && (
                          <div className="text-[10px] leading-tight text-muted-foreground [&_a]:bg-[#844240] [&_a]:font-medium [&_a]:text-wl-white [&_a]:rounded-full [&_a]:px-1.5 [&_a]:py-0.5 [&_a]:hover:underline">
                            <span
                              dangerouslySetInnerHTML={{
                                __html: perf.entry_coachnotes.trim(),
                              }}
                            />
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DrawerFooter className="border-t border-border/60 pt-3">
          <div className="flex flex-col items-stretch justify-end gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              {songId && (
                <Button type="button" size="sm" variant="outline" asChild>
                  <Link href={`/archive/song/${songId}`}>
                    View full song history
                  </Link>
                </Button>
              )}
              <DrawerClose asChild>
                <Button type="button" size="sm" variant="ghost">
                  Close
                </Button>
              </DrawerClose>
            </div>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
