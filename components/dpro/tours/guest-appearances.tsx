"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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

interface GuestCount {
  guest_id: string
  guest: string
  count: number
}

interface SongWithGuest {
  entry_song: string
  show_date: string
  show_id: string
  show_venue_location: string
  entry_length: string | null
  entry_short: string | null
  entry_segue: string | null
}

interface GuestAppearancesProps {
  showIds: string[]
  tourId?: string
  onDataLoaded?: (hasData: boolean) => void
}

function formatTourDate(dateStr: string): string {
  if (!dateStr) return ""
  const parts = dateStr.split("-")
  if (parts.length >= 3) {
    return `${parts[1]}.${parts[2]}.${parts[0].slice(2)}`
  }
  return dateStr
}

export function GuestAppearances({
  showIds,
  tourId,
  onDataLoaded,
}: GuestAppearancesProps) {
  const [guestCounts, setGuestCounts] = useState<GuestCount[]>([])
  const [loading, setLoading] = useState(true)
  const [modalData, setModalData] = useState<{
    isOpen: boolean
    guestId: string
    guestName: string
    songs: SongWithGuest[]
    tourName: string
  }>({
    isOpen: false,
    guestId: "",
    guestName: "",
    songs: [],
    tourName: "",
  })

  useEffect(() => {
    if (!showIds?.length) {
      setLoading(false)
      onDataLoaded?.(false)
      return
    }

    async function fetchGuestAppearances() {
      try {
        const { supabase } = await import("@/lib/supabase")
        if (!supabase) {
          setLoading(false)
          onDataLoaded?.(false)
          return
        }

        const { data: entriesData, error: entriesError } = await supabase
          .from("setlist_entries")
          .select(
            `
            entry_id,
            entry_show,
            setlist_entry_guests (
              guest_id,
              guests (
                guest_id,
                guest,
                guest_category
              )
            )
          `,
          )
          .in("entry_show", showIds)

        if (entriesError) throw entriesError

        const guestCountMap: Record<
          string,
          { guest: string; count: number }
        > = {}

        for (const entry of entriesData ?? []) {
          const guests = (entry as any).setlist_entry_guests ?? []
          const nonGoose = guests.filter((seg: any) => {
            const cat = seg.guests?.guest_category
            return (
              cat !== "Goose (current)" && cat !== "Goose (former)"
            )
          })
          if (nonGoose.length > 0) {
            for (const seg of nonGoose) {
              const g = seg.guests
              if (g) {
                if (!guestCountMap[g.guest_id]) {
                  guestCountMap[g.guest_id] = { guest: g.guest, count: 0 }
                }
                guestCountMap[g.guest_id].count++
              }
            }
          }
        }

        const sorted = Object.entries(guestCountMap)
          .map(([guest_id, { guest, count }]) => ({ guest_id, guest, count }))
          .sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count
            return a.guest.localeCompare(b.guest)
          })

        setGuestCounts(sorted)
        onDataLoaded?.(sorted.length > 0)
      } catch (err) {
        console.error("Error fetching guest appearances:", err)
        onDataLoaded?.(false)
      } finally {
        setLoading(false)
      }
    }

    fetchGuestAppearances()
  }, [showIds, onDataLoaded])

  const handleGuestClick = async (guestId: string, guestName: string) => {
    try {
      const { supabase } = await import("@/lib/supabase")
      if (!supabase) return

      let tourName = ""
      if (tourId) {
        const { data } = await supabase
          .from("tours")
          .select("tour")
          .eq("tour_id", tourId)
          .single()
        if (data) tourName = data.tour
      }

      const { data, error } = await supabase
        .from("setlist_entries")
        .select(
          `
          entry_song,
          entry_length,
          entry_short,
          entry_segue,
          entry_show,
          entry_set,
          entry_setnum,
          setlist_entry_guests!inner (
            guest_id
          ),
          shows (
            show_date,
            show_venue_location,
            show_canonid
          )
        `,
        )
        .in("entry_show", showIds)
        .eq("setlist_entry_guests.guest_id", guestId)
        .order("shows(show_canonid)", { ascending: true })
        .order("entry_set", { ascending: true })
        .order("entry_setnum", { ascending: true })

      if (error) throw error

      const songs: SongWithGuest[] = (data ?? []).map((entry: any) => {
        const show = Array.isArray(entry.shows) ? entry.shows[0] : entry.shows
        return {
          entry_song: entry.entry_song,
          show_date: show?.show_date ?? "",
          show_id: entry.entry_show,
          show_venue_location: show?.show_venue_location ?? "",
          entry_length: entry.entry_length,
          entry_short: entry.entry_short,
          entry_segue: entry.entry_segue,
        }
      })

      setModalData({
        isOpen: true,
        guestId,
        guestName,
        songs,
        tourName,
      })
    } catch (err) {
      console.error("Error fetching guest songs:", err)
    }
  }

  if (!loading && guestCounts.length === 0) return null

  return (
    <>
      <Card className="ring-0 border border-border/60 bg-card/80 overflow-hidden py-0">
        <div className="px-3 py-1.5 bg-muted/60">
          <h2 className="text-sm font-semibold">Guest Appearances</h2>
        </div>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-2 text-center text-muted-foreground text-xs">
              Loading…
            </div>
          ) : (
            <div>
              <table className="w-full border-collapse min-w-max text-xs">
                <tbody>
                  {guestCounts.map((guest) => (
                    <tr
                      key={guest.guest_id}
                      className="bg-background/70 hover:bg-muted/40 transition-colors"
                    >
                      <td className="pl-3 py-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleGuestClick(guest.guest_id, guest.guest)
                          }
                          className="font-medium text-foreground hover:underline underline-offset-4 cursor-pointer text-left"
                        >
                          {guest.guest}
                        </button>
                      </td>
                      <td className="w-[30px] py-1.5 text-center font-medium tabular-nums text-foreground">
                        {guest.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Drawer
        open={modalData.isOpen}
        onOpenChange={(open) =>
          !open && setModalData((p) => ({ ...p, isOpen: false }))
        }
      >
        <DrawerContent className="mx-auto w-full max-w-4xl text-xs flex flex-col max-h-[90vh] data-[vaul-drawer-direction=bottom]:max-h-[90vh] data-[vaul-drawer-direction=bottom]:min-h-[70vh] after:!h-0">
          <DrawerHeader className="shrink-0 border-b border-border/60 pt-1 pb-3 px-4 flex flex-row items-center justify-between md:justify-center gap-3">
            <div className="w-8 shrink-0 md:hidden" aria-hidden />
            <div className="flex flex-1 min-w-0 justify-center">
              <div className="space-y-1 text-center">
                <DrawerTitle className="text-sm font-medium text-foreground m-0">
                  {modalData.guestName}
                </DrawerTitle>
                {modalData.tourName && (
                  <p className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {modalData.tourName}
                  </p>
                )}
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
                      {song.entry_song}
                    </TableCell>
                    <TableCell className="align-middle py-1.5 px-2 text-center text-[11px] whitespace-nowrap">
                      <Link
                        href={`/dpro/setlist/${song.show_id}`}
                        onClick={() =>
                          setModalData((p) => ({ ...p, isOpen: false }))
                        }
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
                      {formatEntryLength(song.entry_length) || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DrawerFooter className="border-t border-border/60 shrink-0 pt-3 pb-4">
            <div className="flex flex-col items-stretch justify-end gap-2 sm:flex-row sm:items-center sm:justify-center">
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/dpro/personnel/${modalData.guestId}`}
                  onClick={() =>
                    setModalData((p) => ({ ...p, isOpen: false }))
                  }
                >
                  Guest Profile
                </Link>
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}
