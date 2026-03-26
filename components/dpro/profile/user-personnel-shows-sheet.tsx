"use client"


import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getTourArchiveUrl } from "@/lib/tour-archive-url"
import { getPersonnelArchiveUrl } from "@/lib/personnel-archive-url"
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
import { formatSetlistDate } from "@/lib/setlist-utils"
import { useGuestUserShows } from "@/hooks/use-guest-user-shows"

interface UserPersonnelShowsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  guestName: string | null
  guestId: string | null
  attendedShowIds: string[]
  isOwnProfile: boolean
}

export function UserPersonnelShowsSheet({
  open,
  onOpenChange,
  guestName,
  guestId,
  attendedShowIds,
  isOwnProfile,
}: UserPersonnelShowsSheetProps) {
  const { shows, loading, error } = useGuestUserShows(
    open,
    guestId,
    attendedShowIds
  )

  const badgeLabel = isOwnProfile ? "Your shows" : "Attended shows"

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto w-full max-w-4xl text-xs">
        <DrawerHeader className="border-b border-border/60 pt-1 pb-3">
          <DrawerTitle className="sr-only">
            {guestName ? `${guestName} – shows seen` : "Personnel shows"}
          </DrawerTitle>
          {guestName ? (
            <div className="space-y-1 text-[11px]">
              <p className="text-sm font-medium text-foreground">{guestName}</p>
              <p className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {badgeLabel}
              </p>
            </div>
          ) : (
            <DrawerDescription>No personnel selected.</DrawerDescription>
          )}
        </DrawerHeader>

        <div className="flex max-h-[52vh] min-h-[140px] flex-col overflow-y-auto px-3 pb-3 pt-2">
          {!guestName || !guestId ? (
            <p className="text-[11px] text-muted-foreground">
              Select a musician to view shows you&apos;ve seen them at.
            </p>
          ) : loading ? (
            <div className="flex min-h-[140px] flex-1 items-center justify-center">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                <span>Loading shows…</span>
              </div>
            </div>
          ) : error ? (
            <p className="text-[11px] text-destructive">{error}</p>
          ) : shows.length === 0 ? (
            <p className="py-2 text-[11px] text-muted-foreground">
              No shows found where you&apos;ve seen this musician.
            </p>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="min-w-full border-separate border-spacing-y-0.25 text-[11px]">
                <TableHeader>
                  <TableRow className="border-b border-border/60 hover:bg-transparent">
                    <TableHead className="whitespace-nowrap text-center text-[11px]">
                      Date
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-[11px]">
                      Tour
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-[11px]">
                      Venue
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-[11px]">
                      Group
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shows.map((show) => (
                    <TableRow key={show.show_id} className="align-middle">
                      <TableCell className="whitespace-nowrap px-2 py-1 text-center align-middle text-[11px]">
                        <Link
                          href={getSetlistArchiveUrl(show.show_id)}
                          className="hover:underline"
                          onClick={() => onOpenChange(false)}
                        >
                          {formatSetlistDate(show.show_date)}
                        </Link>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-2 py-1 align-middle text-[11px]">
                        {show.show_tour ? (
                          show.tour_id ? (
                            <Link
                              href={getTourArchiveUrl(show.tour_id)}
                              className="hover:underline"
                              onClick={() => onOpenChange(false)}
                            >
                              {show.show_tour}
                            </Link>
                          ) : (
                            <span>{show.show_tour}</span>
                          )
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-2 py-1 align-middle text-[11px]">
                        {show.venue_id ? (
                          <Link
                            href={`/archive/venue/${show.venue_id}`}
                            className="hover:underline"
                            onClick={() => onOpenChange(false)}
                          >
                            {show.show_venue_location || "—"}
                          </Link>
                        ) : (
                          <span>{show.show_venue_location || "—"}</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-2 py-1 align-middle text-[11px]">
                        {show.show_group || "—"}
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
              {guestId && (
                <Button type="button" size="sm" variant="outline" asChild>
                  <Link
                    href={getPersonnelArchiveUrl(guestId)}
                    onClick={() => onOpenChange(false)}
                  >
                    View full personnel page
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
