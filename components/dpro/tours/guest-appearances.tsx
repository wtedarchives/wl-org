"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { MoveRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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

      <Sheet
        open={modalData.isOpen}
        onOpenChange={(open) =>
          !open && setModalData((p) => ({ ...p, isOpen: false }))
        }
      >
        <SheetContent
          side="bottom"
          className="max-h-[90vh] flex flex-col p-0 rounded-t-xl"
        >
          <SheetHeader className="border-b border-border/60 px-4 py-2 bg-muted/50 flex-row items-center justify-between gap-4 shrink-0">
            <div className="flex flex-1 items-center gap-2 flex-wrap">
              <SheetTitle className="text-sm font-semibold m-0">
                {modalData.guestName}
              </SheetTitle>
              {modalData.tourName && (
                <span className="text-xs font-medium bg-background text-foreground px-2 py-0.5 rounded border border-border whitespace-nowrap">
                  {modalData.tourName}
                </span>
              )}
            </div>
          </SheetHeader>
          <div className="overflow-x-auto flex-1 min-h-0">
            <table className="w-full border-collapse min-w-max text-[0.625rem]">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-2 py-1 text-left font-medium">Song</th>
                  <th className="px-2 py-1 text-center font-medium">Show</th>
                  <th className="px-2 py-1 text-left font-medium">Location</th>
                  <th className="px-2 py-1 text-left font-medium">&nbsp;</th>
                  <th className="px-2 py-1 text-center font-medium">Length</th>
                </tr>
              </thead>
              <tbody>
                {modalData.songs.map((song) => (
                  <tr
                    key={`${song.show_id}-${song.entry_song}`}
                    className="bg-background/70 hover:bg-muted/40"
                  >
                    <td className="px-2 py-1 font-medium">{song.entry_song}</td>
                    <td className="px-2 py-1 text-center whitespace-nowrap">
                      <Link
                        href={`/dpro/setlist/${song.show_id}`}
                        onClick={() =>
                          setModalData((p) => ({ ...p, isOpen: false }))
                        }
                        className="font-medium hover:underline"
                      >
                        {formatTourDate(song.show_date)}
                      </Link>
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-muted-foreground">
                      {song.show_venue_location}
                    </td>
                    <td className="px-2 py-1">
                      {song.entry_short && (
                        <span className="text-destructive mr-2 font-medium">
                          [{song.entry_short}]
                        </span>
                      )}
                      {song.entry_segue && (
                        <MoveRight className="text-destructive inline size-4" />
                      )}
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-center text-muted-foreground">
                      {formatEntryLength(song.entry_length)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border/60 px-4 py-2 bg-muted/50 flex justify-center">
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
        </SheetContent>
      </Sheet>
    </>
  )
}
